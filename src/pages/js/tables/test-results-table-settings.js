import * as helpers from './data-table-helpers.js';

function bodyCellDisplay (header, row, headerIdx, rowIdx) {
    let cellContent = "";
    if (header.id == "testId") {
        cellContent = `<a id="${row.test.testId}" href="#${row.test.testId}">${row.test.testId}</span>`;
    }
    else if (header.id == "name") {
        cellContent = row.test.name;
    }
    else if (header.id == "description") {
        cellContent = row.test.description;
    }
    else if (header.id == "result") {
        cellContent = `<span class="${row.value == "PASS" ? "pass" : "fail"}">${helpers.resultNames[row.value]}</span>`;
    }
    else if (header.id == "notes") {
        cellContent = row.notesArePublic ? row.notes != 'null' ? row.notes : '' : '';
    }
    return cellContent;
}

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

export {
    bodyCellDisplay,
    textSearchFilter
};