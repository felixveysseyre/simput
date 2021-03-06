import PropertyPanelBlock   from 'paraviewweb/src/React/Properties/PropertyPanel';
import React                from 'react';

import style                from 'SimputStyle/Simput.mcss';

import ViewMenu             from '../ViewMenu';
import modelGenerator       from '../modelGenerator';
import { postJSON }         from '../network';

const buttonStates = {
  normal: style.normalStateIcon,
  busy: style.busyStateIcon,
  error: style.errorStateIcon,
  success: style.successStateIcon,
};

export default React.createClass({

  displayName: 'Simput',

  propTypes: {
    convert: React.PropTypes.func,
    data: React.PropTypes.object,
    help: React.PropTypes.object,
    labels: React.PropTypes.object,
    model: React.PropTypes.object,
    parse: React.PropTypes.func,
  },

  getInitialState() {
    return {
      fullData: this.props.data, // { input: bool, data: { type: '', data: {...}} }
      panelData: [],     // data for the current property panel
      viewData: {}, // generated data structure for the view
      downloadButtonState: 'normal',
    };
  },

  saveModel() {
    this.downloadFile(JSON.stringify(this.state.fullData.data, null, '    '), this.state.fullData.data.type);
  },

  parseFile(e) {
    if (e.currentTarget.files.length === 0) {
      alert('No files selected');
      return;
    }
    const type = this.state.fullData.data.type;
    const file = e.currentTarget.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      const newFullData = Object.assign({}, this.state.fullData);
      try {
        newFullData.data = this.props.parse(type, reader.result);
        this.setState({ fullData: newFullData });
      } catch (error) {
        alert(`Error parsing file:\n${error}`);
      }
    };
    reader.readAsText(file);
  },

  convertModel() {
    if (!this.props.convert) {
      console.log(`There is no convert function for "${this.state.fullData.type}"`);
      return;
    }

    const results = this.props.convert(this.state.fullData);

    if (!results.error) {
      console.log('posting', results);
      this.setState({ downloadButtonState: 'busy' });
      postJSON('/data', {
        results: results.results,
        model: results.model,
        copies: results.copies || [],
      }, (error, data) => {
        if (error) {
          console.log('there was an error');
          console.log(error.message);
          this.setState({ downloadButtonState: 'error' });
        }
        this.setState({ downloadButtonState: 'success' });
        setTimeout(() => {
          this.setState({ downloadButtonState: 'normal' });
        }, 2000);
      });
    } else {
      console.log('There was an error converting: ');
      console.log(results.error.message);
    }
  },

  // contents is a string here.
  downloadFile(contents, type) {
    var newFileContent = new Blob([contents], {
        type: 'application/octet-binary',
      }),
      downloadURL = window.URL.createObjectURL(newFileContent),
      downloadLink = document.getElementById('file-download-link');

    downloadLink.href = downloadURL;
    downloadLink.download = `${type}.json`;
    downloadLink.click();

    // Free memory
    setTimeout(() => {
      window.URL.revokeObjectURL(downloadURL);
    }, 1000);
  },

  updateActive(viewId, index) {
    if (viewId === -1 && index === -1) {
      const panelData = [],
        viewData = {};
      this.setState({ panelData, viewData });
      return;
    }

    const panelData = modelGenerator(this.props.model, this.state.fullData, viewId, index,
                                this.props.labels.activeLabels.attributes, this.props.help),
      viewData = this.state.fullData.data[viewId][index];
    this.setState({ panelData, viewData });
  },

  updateViewData(newData) {
    const viewData = this.state.viewData,
      keypath = newData.id.split('.'),
      attrName = keypath.shift();
    viewData[attrName][keypath.join('.')].value = newData.value;
    this.setState({ viewData });
  },

  render() {
    return (
      <div className={style.container}>
        <div className={style.header}>
          <span className={style.title}>Simput</span>
          <div>
            { this.props.convert !== null ? (
              <div style={{ display: 'inline-block' }}>
                <input type="file" id="fileElem" style={{ display: 'none' }} onChange={this.parseFile} />
                <label className={[style.button, style.buttonLabel].join(' ')} htmlFor="fileElem">
                  Import File <i className={style.uploadIcon} />
                </label>
              </div>
              ) :
            null }
            <button className={style.button} onClick={this.saveModel}>
              <span className={style.buttonText}>Download Model</span>
              <i className={style.saveIcon} />
            </button>
            <button className={style.button} onClick={this.convertModel} disabled={this.state.downloadButtonState !== 'normal'}>
              <span className={style.buttonText}>Save & Convert</span>
              <i className={buttonStates[this.state.downloadButtonState]} />
            </button>
          </div>
        </div>
        <div className={style.content}>
          <ViewMenu
            data={this.state.fullData}
            model={this.props.model}
            labels={this.props.labels}
            onChange={this.updateActive}
          />
          <div className={style.block}>
            <PropertyPanelBlock
              className={style.panel}
              input={this.state.panelData}
              labels={this.props.labels}
              viewData={this.state.viewData}
              onChange={this.updateViewData}
            />
          </div>
        </div>
      </div>);
  },
});
