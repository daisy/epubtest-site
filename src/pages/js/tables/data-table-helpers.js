let calcScore = score => {
    return parseFloat(parseFloat(score).toFixed(2));
};

let makeScoreSpan = answerSet => 
    answerSet && answerSet.isTested ? 
        `<span>${calcScore(answerSet.score)}%</span>` 
        : 
        `<span class="not-tested">Not tested</span>`
;

const topicNames = {
    "basic-functionality": "Basic Functionality",
    "visual-adjustments": "Visual Adjustments",
    "non-visual-reading": "Non-Visual Reading",
    "read-aloud": "Read Aloud",
    "media-overlays": "Media Overlays",
    "extended-descriptions": "Extended Descriptions",
    "math": "Mathematics"
}

const resultNames = {
    "PASS": "Pass",
    "FAIL": "Fail",
    "NA": "Not applicable",
    "NOANSWER": "No answer"
};

function getTopicName(id) {
    let retval = topicNames.hasOwnProperty(id) ? topicNames[id] : '';
    return retval;
}
let sortBySoftwareName = (rowA, rowB, path) => {
    let softwareA = path(rowA);
    let softwareB = path(rowB);

    if (softwareA == null || softwareA == undefined || softwareA.name == '') {
        return 1;
    }
    if (softwareB == null || softwareB == undefined || softwareB.name == '') {
        return -1;
    }

    if (softwareA?.name.toLowerCase() > softwareB?.name.toLowerCase()) {
        return 1;
    }
    else if (softwareA?.name.toLowerCase() < softwareB?.name.toLowerCase()) {
        return -1
    }
    else {
        if (softwareA?.version.toLowerCase() > softwareB?.version.toLowerCase()) {
            return 1;
        }
        else if (softwareA?.version.toLowerCase() < softwareB?.version.toLowerCase()) {
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
        result = sortBySoftwareName(rowA, rowB, row => row.readingSystem);
    }
    return result;
};

function stringSort (rowA, rowB, path) {
    let valA = path(rowA).toString().toLowerCase();
    let valB = path(rowB).toString().toLowerCase();
    return valA > valB ? 1 : valA < valB ? -1 : 0;
}

function dateSort(rowA, rowB, path) {
    let valA = path(rowA);
    let valB = path(rowB);

    let diff = dayjs(valA).diff(dayjs(valB));
    return diff > 0 ? -1 : diff < 0 ? 1 : 0;
}
function booleanSort(rowA, rowB, path) {
    let valA = path(rowA) ? 1 : 0;
    let valB = path(rowB) ? 1 : 0;
    return valA > valB ? 1 : valA < valB ? -1 : 0;
}
function numberSort(rowA, rowB, path) {
    let valA = parseFloat(path(rowA));
    let valB = parseFloat(path(rowB));
    return valA > valB ? 1 : valA < valB ? -1 : 0;
}
function testingEnvironmentLink(testenv, urlpart, className="") {
    return `
        <a href="./${urlpart}/${testenv.id}" class="${className}">
            <span class="sw readingSystem">
                <span class="name">${testenv.readingSystem.name}</span>
                <span class="version">${testenv.readingSystem.version}</span>
            </span>
            ${testenv.hasOwnProperty('assistiveTechnology') && testenv.assistiveTechnology ? 
                `<span class="sw assistiveTechnology">
                    <span class="name">${testenv.assistiveTechnology.name}</span> 
                    <span class="version">${testenv.assistiveTechnology.version}</span>
                    </span>`
                : 
                ``
            }
            ${testenv.hasOwnProperty('browser') && testenv.browser ? 
                `<span class="sw browser">
                    <span class="name">${testenv.browser.name}</span> 
                    <span class="version">${testenv.browser.version}</span>
                    </span>`
                : 
                ``
            }
            <span class="sw os">
                <span class="name">${testenv.os.name}</span>
                <span class="version">${testenv.os.version}</span>
            </span>
        </a>`;
}

let softwareNameString = (sw, vendor = false) => {
    if (!sw) {
        return '';
    }
    let str = 
    `${vendor ? sw.vendor : ""}`
    + " " + sw.name
    + " " + sw.version;

    return str;
};

function testingEnvironmentString(testenv, vendor = false) {

    let testingEnvironmentString = softwareNameString(testenv.readingSystem).toLowerCase()
    + " " + softwareNameString(testenv.assistiveTechnology, vendor).toLowerCase()
    + " " + softwareNameString(testenv.os, vendor).toLowerCase()
    + " " + softwareNameString(testenv.device, vendor).toLowerCase()
    + " " + softwareNameString(testenv.browser, vendor).toLowerCase();

    return testingEnvironmentString;
}
export {calcScore, makeScoreSpan, topicNames, getTopicName, 
        sortBySoftwareName, sortByScore, stringSort, dateSort, booleanSort, numberSort, 
        testingEnvironmentLink, testingEnvironmentString, softwareNameString, resultNames};