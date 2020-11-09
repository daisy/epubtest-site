import * as helpers from './data-table-helpers.js';

function getBodyCellDisplay (header, row, headerIdx, rowIdx, requestsToPublish, isAdmin, testingEnvironment) {
    let cellContent = "";
    if (header.id == "topic") {
        cellContent = helpers.getTopicName(row.testBook.topic.id);
    }
    else if (header.id == "score") {
        cellContent = helpers.makeScoreSpan(row);
    }
    else if (header.id == "edit") {
        cellContent = `<a href="/user/edit-results/${row.id}">Edit</a>`;
    }
    else if (header.id == "publish") {
        if (isAdmin) {
            if (row.isPublic) {
                cellContent = `
                <span>Published</span>
                <form method="POST" action="/admin/forms/unpublish">
                    <input type="hidden" name="next" value="/user/dashboard">
                    <input type="hidden" name="testingEnvironmentId" value="${testingEnvironment.id}">
                    <input type="hidden" name="answerSetId" value="${row.id}">
                    <input type="submit" name="submit" value="Unpublish">
                </form>`;
            }
            else {
                cellContent = `
                <span>Unpublished</span>
                <form method="POST" action="/admin/forms/publish">
                    <input type="hidden" name="next" value="/user/dashboard">
                    <input type="hidden" name="testingEnvironmentId" value="${testingEnvironment.id}">
                    <input type="hidden" name="answerSetId" value="${row.id}">
                    <input type="submit" name="submit" value="Publish">
                </form>`;
            }
        }
        else {
            let requestToPublish = requestsToPublish.hasOwnProperty(row.id);

            if (row.isPublic) {
                cellContent = `<a href="/results/${testingEnvironment.id}#${row.testBook.topic.id}">Published</a>`;
            }
            else {
                if (requestToPublish) {
                    cellContent = `<span>Request pending</span>`;
                }
                else {
                    cellContent = `
                    <form method="POST" action="/user/forms/request-to-publish">
                        <input type="hidden" name="answerSetId" value="${row.id}"/>
                        <input type="submit" name="submit" value="Request to publish"/>
                    </form>`;
                }
            }
        }
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

function textSearchFilter (text, row, headers, hiddenColumns) {
   return true;
}

export let options = {
    getBodyCellDisplay,
    getHeaderCellDisplay,
    filters,
    textSearchFilter
};