import * as helpers from './data-table-helpers.js';

function getBodyCellDisplay (header, row) {
    let cellContent = "";
    if (header.id == "testId") {
        cellContent = row.test.testId;
    }
    else if (header.id == "name") {
        cellContent = row.test.name;
    }
    else if (header.id == "description") {
        cellContent = row.test.description;
    }
    else if (header.id == "result") {
        cellContent = helpers.resultNames[row.value];
    }
    else if (header.id == "notes") {
        cellContent = row.notes != 'null' ? row.notes : '';
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
function textSearchFilter(text, row, headers, hiddenColumns) {
    let rowArr = [
        `${row.test.testId}`,
        `${row.test.name}`,
        `${row.test.description}`,
        `${row.value}`,
        `${row.notes}`,
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