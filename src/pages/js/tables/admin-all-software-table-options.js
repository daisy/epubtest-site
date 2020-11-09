import * as helpers from './data-table-helpers.js';

function getBodyCellDisplay (header, row, headerIdx, rowIdx) {
    let cellContent = "";
    if (header.id == "id") {
        cellContent = row.id;
    }
    else if (header.id == "vendor") {
        cellContent = row.vendor;
    }
    else if (header.id == "name") {
        cellContent = row.name;
    }
    else if (header.id == "version") {
        cellContent = row.version;
    }
    else if (header.id == "shownInDropdown") {
        cellContent = row.active ? "Yes" : "No";
    }
    else if (header.id == "usage") {
        cellContent = `
        ${row.testingEnvironments.length}
        ${row.testingEnvironments.length ? 
            `<br>
            <a href="/admin/software/${row.id}">See usage</a>`
            : ``}
        `
    }
    else if (header.id == "actions") {
        cellContent = `
        <ul>
            <li><a href="/admin/edit-software/${row.id}">Edit</a></li>
            <li>
                ${row.testingEnvironments.length == 0 ? 
                `<form method="POST" action="/admin/forms/confirm-delete-software/${row.id}">
                    <input type="submit" name="submit" value="Delete"/>
                </form>`
                : 
                `<span>Cannot delete; in use.</span>`
                }
            </li>
        </ul>`;
    }
    
    return {
        cellClass: "",
        cellContent
    };
}
    
function getHeaderCellDisplay(header, idx) {
    return header.title;
}

let filters = {
    vendor: {
        name: "Vendor",
        path: row => row.vendor
    },
    name: {
        name: "Name",
        path: row => row.name
    },
    shown: {
        name: "Shown in dropdown",
        path: row => row.active
    }
};

// return whether the row contains the text    
function textSearchFilter (text, row, headers, hiddenColumns) {
    let rowArr = [
        `${row.id}`,
        `${row.vendor}`,
        `${row.name}`,
        `${row.version}`,
        `${row.active ? "Yes" : "No"}`,
        `${row.testingEnvironments.length}`
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