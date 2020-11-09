import * as helpers from './data-table-helpers.js';

function getBodyCellDisplay (header, row, headerIdx, rowIdx, requestsToPublish, testingEnvironment, users) {
    let cellContent = "";
    if (header.id == "topic") {
        cellContent = helpers.getTopicName(row.testBook.topic.id);
    }
    else if (header.id == "testBookVersion") {
        cellContent = `
        <a href="/books/${row.testBook.filename}">
            v${row.testBook.version} (${ row.testBook.lang.id })
        </a>`;
    }
    else if (header.id == "assignedTo") {
        cellContent = `
        <form method="POST" action="/admin/forms/set-user">
            <select name="userId">
                ${row.user == null ? 
                    `<option value="None" selected="selected">None</option>`
                    : 
                    `<option value="None">None</option>`
                }
                ${users.map(user => `
                    ${row.user && user.id == row.user.id ? 
                    `<option value="${user.id}" selected="selected">`
                    :
                    `<option value="${user.id}">`}
                        ${user.name}
                    </option>
                `)
                .join('')}
            </select>
            <input type="hidden" name="answerSetId" value="${row.id}">
            <input type="hidden" name="next" value="/admin/testing-environment/${testingEnvironment.id}">
            <input type="submit" value="Assign">  
        </form>
        `;
    }
    else if (header.id == "score") {
        cellContent = helpers.makeScoreSpan(row);
    }
    else if (header.id == "edit") {
        cellContent = `<a href="/user/edit-results/${row.id}?next=/admin/testing-environment/${testingEnvironment.id}">Edit</a>`;
    }
    else if (header.id == "status") {
        if (row.isPublic) {
            cellContent = `
            <span>Published</span>
            <form method="POST" action="/admin/forms/unpublish">
                <input type="hidden" name="next" value="/admin/testing-environment/${testingEnvironment.id}"/>
                <input type="hidden" name="testingEnvironmentId" value="${testingEnvironment.id}"/>
                <input type="hidden" name="answerSetId" value="${row.id}"/>
                <input type="submit" name="submit" value="Unpublish"/>
            </form>`;
        }
        else {
            cellContent = `
            <span>Unpublished</span>
            <form method="POST" action="/admin/forms/publish">
                <input type="hidden" name="next" value="/admin/testing-environment/${testingEnvironment.id}"/>
                <input type="hidden" name="testingEnvironmentId" value="${testingEnvironment.id}"/>
                <input type="hidden" name="answerSetId" value="${row.id}"/>
                <input type="submit" name="submit" value="Publish"/>
            </form>`;
        }
    }
    else if (header.id == "publishingRequested") {
        cellContent = requestsToPublish.hasOwnProperty(row.id) ? "Yes" : "No";
    }
    return {
        cellClass: "",
        cellContent
    };
}
    
function getHeaderCellDisplay(header, idx) {
    return header.title;
}

let filters = (requestsToPublish) => {

    return {
        topic: {
            name: "Topic",
            path: row => helpers.getTopicName(row.testBook.topic.id)
        },
        user: {
            name: "Assigned to",
            path: row => row.user ? row.user.name : "None",
            includeNone: true
        },
        published: {
            name: "Is published",
            path: row => row.isPublic
        },
        requests: {
            name: "Publishing requested",
            path: row => requestsToPublish.hasOwnProperty(row.id)
        }
    }; 
};

function textSearchFilter (text, row, headers, hiddenColumns) {
   return true;
}

export let options = {
    getBodyCellDisplay,
    getHeaderCellDisplay,
    filters,
    textSearchFilter
};