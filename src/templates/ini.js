module.exports = function (title, items, options) {
    var out = '';

    if (items.type) {
        out = '[' + title + items.type + ']\n';
    } else {
        out = '[' + title + ']\n';
    }

    for (var key in items) {
        if (!items[key] || key === 'type') {
            continue;
        }

        out += key + ' = ' + items[key] + '\n';
    }

    if (out.match(/\n/g).length === 1) {
        return '';
    }

    return out;
}
