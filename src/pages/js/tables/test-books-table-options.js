import * as helpers from './data-table-helpers.js';

function getBodyCellDisplay (header, row) {
    let cellContent = "";
    if (header.id == "topic") {
        cellContent = helpers.getTopicName(row.topicId);
    }
    else if (header.id == "title") {
        cellContent = row.title;
    }
    else if (header.id == "version") {
        cellContent = row.version;
    }
    else if (header.id == "language") {
        cellContent = row.langId;
    }
    else if (header.id == "description") {
        cellContent = row.description;
    }
    else if (header.id == "download") {
        cellContent = `<a href="/books/${row.filename}" title="${row.title}">Download</a>`;
    }
    return {
        cellClass: "",
        cellContent
    };
}
    
function getHeaderCellDisplay(header) {
    return header.title;
}

let filters = {};

// return whether the row contains the text    
function textSearchFilter (text, row, headers, hiddenColumns) {
    let rowArr = [
        `${helpers.getTopicName(row.topicId)}`,
        `${row.title}`,
        `${row.version}`,
        `${row.langId}`,
        `${row.description}`
    ];
    rowArr = rowArr.filter((item, idx) => !hiddenColumns.includes(idx));

    let rowString = rowArr.join(' ');
    
    let found = rowString.toLowerCase().indexOf(text.toLowerCase()) != -1;
    return found;
}

export let options = {
    getBodyCellDisplay,
    getHeaderCellDisplay,
    filters,
    textSearchFilter
};