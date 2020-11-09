import * as helpers from './data-table-helpers.js';

function getBodyCellDisplay (header, row, headerIdx, rowIdx) {
    let cellContent = "";
    if (header.id == "topic") {
        cellContent = helpers.getTopicName(row.answerSet.testBook.topic.id);
    }
    else if (header.id == "testingEnvironment") {
        cellContent = helpers.testingEnvironmentLink(row.answerSet.testingEnvironment, 'testing-environment');
    }
    else if (header.id == "requestedOn") {
        cellContent = dayjs(row.created).format("YYYY-MM-DD HH:mm:ss");
    }
    else if (header.id == "user") {
        cellContent = row.answerSet.user.name;
    }
    else if (header.id == "action") {
        cellContent = `
        <form method="POST" action="/admin/forms/handle-request">
            <input type="hidden" name="requestId" value="${row.id}"></input>
            <input type="hidden" name="answerSetId" value="${row.answerSet.id}"></input>
            <input type="submit" name="approve" value="Approve"></input>
            <input type="submit" name="deny" value="Deny"></input>
        </form>`;
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
        `${helpers.getTopicName(row.answerSet.testBook.topic.id)}`,
        `${helpers.testingEnvironmentString(row.answerSet.testingEnvironment)}`,
        `${dayjs(row.created).format("YYYY-MM-DD HH:mm:ss")}`,
        `${row.answerSet.user.name}`
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