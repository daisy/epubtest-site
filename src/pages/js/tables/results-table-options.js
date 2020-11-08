import * as helpers from './data-table-helpers.js';

function getBodyCellDisplay (header, row) {
    if (header.hasOwnProperty('topic')) {
        let {answerSets} = row;
        let answerSet = answerSets.find(aset => aset.testBook.topic.id === header.topic);
        let score = answerSet && answerSet.isTested ? 
            `<span>${helpers.calcScore(answerSet.score)}%</span>` 
            : 
            `<span class="not-tested">Not tested</span>`;
        let cellClass = answerSet && answerSet.isTested ? "" : "not-tested";
        return {
            cellClass,
            cellContent: score
        };
    } 
    else {
        let cellClass="testenv";
        let cellContent = `
        ${helpers.testingEnvironmentLink(row, 'results')}
        `;   
        return {cellClass, cellContent};     
    }
}

function getHeaderCellDisplay(header) {
    return header.title;
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
    }
};

// return whether the row contains the text    
function textSearchFilter (text, row, headers, hiddenColumns) {
    let testingEnvironmentString = helpers.testingEnvironmentString(row);

    let found = testingEnvironmentString.indexOf(text.toLowerCase()) != -1;
    if (!found) {
        // check each score
        let scores = headers
            .filter((header, idx) => hiddenColumns.includes(idx) == false)
            .filter(header => header.hasOwnProperty('topic'))
            .map(header => {
                let answerSet = row.answerSets.find(aset => aset.testBook.topic.id == header.topic);
                return answerSet && answerSet.isTested ? `${helpers.calcScore(answerSet.score)}%` : 'not tested';
            })
            .join(' ');
        found = scores.indexOf(text.toLowerCase()) != -1;
    }
    return found;
}

export let options = {
    getBodyCellDisplay,
    getHeaderCellDisplay,
    filters,
    textSearchFilter
};