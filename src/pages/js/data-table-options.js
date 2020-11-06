let calcScore = score => {
    return parseFloat(parseFloat(score).toFixed(2));
};

const topicNames = {
    "basic-functionality": "Basic Functionality",
    "visual-adjustments": "Visual Adjustments",
    "non-visual-reading": "Non-Visual Reading",
    "read-aloud": "Read Aloud",
    "media-overlays": "Media Overlays",
    "extended-descriptions": "Extended Descriptions",
    "math": "Mathematics"
}
function getTopicName(id) {
    let retval = topicNames.hasOwnProperty(id) ? topicNames[id] : '';
    return retval;
}

let sortByName = (rowA, rowB) => {
    if (rowA.readingSystem.name > rowB.readingSystem.name) {
        return 1;
    }
    else if (rowA.readingSystem.name < rowB.readingSystem.name) {
        return -1
    }
    else {
        if (rowA.readingSystem.version > rowB.readingSystem.version) {
            return 1;
        }
        else if (rowA.readingSystem.version < rowB.readingSystem.version) {
            return -1;
        }
        else {
            return 0;
        }
    }
};
let sortByScore = (topic, rowA, rowB) => {
    let answerSetA = rowA.answerSets.find(aset => aset.testBook.topic.id === topic);
    let answerSetB = rowB.answerSets.find(aset => aset.testBook.topic.id === topic);
    
    // rank untested answer sets as less than zero for the score
    let scoreA = answerSetA && answerSetA.isTested ? answerSetA.score : -1;
    let scoreB = answerSetB && answerSetB.isTested ? answerSetB.score : -1;

    let result = parseFloat(scoreA) < parseFloat(scoreB) ? 1 : parseFloat(scoreA) > parseFloat(scoreB) ? -1 : 0;

    if (result == 0) {
        result = sortByName(rowA, rowB);
    }
    return result;
};


// for the results grid
let resultsOptions = {
    getBodyCellDisplay: (header, row) => {
        if (header.hasOwnProperty('topic')) {
            let {answerSets} = row;
            let answerSet = answerSets.find(aset => aset.testBook.topic.id === header.topic);
            let score = answerSet && answerSet.isTested ? 
                `<span>${calcScore(answerSet.score)}%</span>` 
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
            <a href="./results/${row.id}">
                <span class="sw readingSystem">
                    <span class="name">${row.readingSystem.name}</span>
                    <span class="version">${row.readingSystem.version}</span>
                </span>
                ${row.hasOwnProperty('assistiveTechnology') && row.assistiveTechnology ? 
                    `<span class="sw assistiveTechnology">
                        <span class="name">${row.assistiveTechnology.name}</span> 
                        <span class="version">${row.assistiveTechnology.version}</span>
                        </span>`
                    : 
                    ``
                }
                ${row.hasOwnProperty('browser') && row.browser ? 
                    `<span class="sw browser">
                        <span class="name">${row.browser.name}</span> 
                        <span class="version">${row.browser.version}</span>
                        </span>`
                    : 
                    ``
                }
                <span class="sw os">
                    <span class="name">${row.os.name}</span>
                    <span class="version">${row.os.version}</span>
                </span>
            </a>
            `;   
            return {cellClass, cellContent};     
        }
    },
    
    getHeaderCellDisplay: header => header.title,

    filters: {
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
    },

    // return whether the row contains the text    
    textSearchFilter: (text, row, headers, hiddenColumns) => {
        let getFullName = sw => {
            if (!sw) {
                return '';
            }
            return sw.vendor.toLowerCase() 
            + " " + sw.name.toLowerCase()
            + " " + sw.version.toLowerCase();
        };

        let testingEnvironmentString = getFullName(row.readingSystem)
        + " " + getFullName(row.assistiveTechnology) 
        + " " + getFullName(row.os)
        + " " + getFullName(row.device)
        + " " + getFullName(row.browser);

        let found = testingEnvironmentString.indexOf(text.toLowerCase()) != -1;
        if (!found) {
            // check each score
            let scores = headers
                .filter((header, idx) => hiddenColumns.includes(idx) == false)
                .filter(header => header.hasOwnProperty('topic'))
                .map(header => {
                    let answerSet = row.answerSets.find(aset => aset.testBook.topic.id == header.topic);
                    return answerSet && answerSet.isTested ? `${calcScore(answerSet.score)}%` : 'not tested';
                })
                .join(' ');
            found = scores.indexOf(text.toLowerCase()) != -1;
        }
        return found;
    }
};

let testBooksOptions = {
    getBodyCellDisplay: (header, row) => {
        let cellContent = "";
        if (header.id == "topic") {
            cellContent = getTopicName(row.topicId);
        }
        else if (header.id == "title") {
            cellContent = row.title;
        }
        else if (header.id == "version") {
            cellContent = row.version;
        }
        else if (header.id == "language") {
            cellContent = row.langId;
        }
        else if (header.id == "description") {
            cellContent = row.description;
        }
        else if (header.id == "download") {
            cellContent = `<a href="/books/${row.filename}" title="${row.title}">Download</a>`;
        }
        return {
            cellClass: "",
            cellContent
        };
    },
    
    getHeaderCellDisplay: header => header.title,

    filters: {},

    // return whether the row contains the text    
    textSearchFilter: (text, row, headers, hiddenColumns) => {
        let rowString = `
        ${getTopicName(row.topicId)}
        ${row.title}
        ${row.version}
        ${row.langId}
        ${row.description}
        Download`;
        let found = rowString.toLowerCase().indexOf(text.toLowerCase()) != -1;
        return found;
    }
}
export {
    resultsOptions,
    testBooksOptions,
    sortByName,
    sortByScore,
    getTopicName
};