import * as helpers from './data-table-helpers.js';

function getBodyCellDisplay (header, row) {
    let cellContent = "";
    if (header.id == "name") {
        cellContent = row.user.name;
    }
    else if (header.id == "email") {
        cellContent = row.user.login.email;
    }
    else if (header.id == "dateInvited") {
        cellContent = dayjs(row.dateInvited).format("YYYY-MM-DD HH:mm:ss");
    }
    else if (header.id == "action") {
        cellContent = `
        <form method="POST" action="/admin/forms/manage-invitations/${row.id}">
            <input name="resend" value="Re-send invitation" type="submit"/>
            <input name="cancel" value="Cancel invitation" type="submit"/>
        </form>`;
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
        `${row.user.name}`,
        `${row.user.login.email}`,
        `${dayjs(row.dateInvited).format("YYYY-MM-DD HH:mm:ss")}`
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