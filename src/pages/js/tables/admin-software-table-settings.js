import * as helpers from './data-table-helpers.js';

function bodyCellDisplay (header, row, headerIdx, rowIdx) {
    let cellContent = "";

    if (header.id == "id") {
        cellContent = row.id;
    }
    else if (header.id == "readingSystem") {
        cellContent = `
            <a href="/admin/software/${row.readingSystem.id}">
                ${helpers.softwareNameString(row.readingSystem)}
            </a>`;
    }
    else if (header.id == "assistiveTechnology") {
        cellContent = row.assistiveTechnology ? `
        <a href="/admin/software/${row.assistiveTechnology.id}">
            ${helpers.softwareNameString(row.assistiveTechnology)}
        </a>` 
        : '';
    }
    else if (header.id == "device") {
        cellContent = row.device ? `
        <a href="/admin/software/${row.device.id}">
            ${helpers.softwareNameString(row.device)}
        </a>` 
        : '';
    }
    else if (header.id == "os") {
        cellContent = `
        <a href="/admin/software/${row.os.id}">
            ${helpers.softwareNameString(row.os)}
        </a>`;
    }
    else if (header.id == "browser") {
        cellContent = row.browser ? `
        <a href="/admin/software/${row.browser.id}">
            ${helpers.softwareNameString(row.browser)}
        </a>`
        : '';
    }
    else if (header.id == "manage") {
        cellContent = `<a href="/admin/testing-environment/${row.id}">Manage</a>`;
    }
    return cellContent;
}

let filters = {
    rs: {
        name: "Reading System",
        path: row => row.readingSystem.name
    },
    at: {
        name: "Assistive Technology",
        path: row => row?.assistiveTechnology?.name,
        includeNone: true
    },
    os: {
        name: "OS",
        path: row => row.os.name
    },
    browser: {
        name: "Browser",
        path: row => row?.browser?.name,
        includeNone: true
    },
    device: {
        name: "Device",
        path: row => row?.device?.name,
        includeNone: true
    }
};

// return whether the row contains the text    
    
function textSearchFilter (text, row, headers, hiddenColumns) {
    let rowArr = [
        `${helpers.softwareNameString(row.readingSystem)}`,
        `${row.id}`,
        `${helpers.softwareNameString(row.assistiveTechnology)}`,
        `${helpers.softwareNameString(row.device)}`,
        `${helpers.softwareNameString(row.os)}`,
        `${helpers.softwareNameString(row.browser)}`
    ];
    rowArr = rowArr.filter((item, idx) => !hiddenColumns.includes(idx));

    let rowString = rowArr.join(' ');
    
    let found = rowString.toLowerCase().indexOf(text.toLowerCase()) != -1;
    return found;
}

export {
    bodyCellDisplay,
    filters,
    textSearchFilter
};