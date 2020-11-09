import * as helpers from './data-table-helpers.js';

function getBodyCellDisplay (header, row, headerIdx, rowIdx) {
    if (header.hasOwnProperty('topic')) {
        let {answerSets} = row;
        let answerSet = answerSets.find(aset => aset.testBook.topic.id === header.topic);
        let score = helpers.makeScoreSpan(answerSet);
        let cellClass = answerSet && answerSet.isTested ? "score" : "not-tested";
        let cellContent = answerSet && answerSet.isTested ? 
            `<a href="/results/${row.id}/#${answerSet.testBook.topic.id}">${score}</a>`
            :
            score;
        return {
            cellClass,
            cellContent
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

function getHeaderCellDisplay(header, idx) {
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