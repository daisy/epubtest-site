import * as helpers from './data-table-helpers.js';

function getBodyCellDisplay (header, row, headerIdx, rowIdx) {
    let cellContent = "";
    if (header.id == "name") {
        cellContent = row.name;
    }
    
    return {
        cellClass: "",
        cellContent
    };
}
    
function getHeaderCellDisplay(header, idx) {
    return header.title;
}

let filters = {};

// return whether the row contains the text    
function textSearchFilter (text, row, headers, hiddenColumns) {
    let rowArr = [
        `${row.name}`
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