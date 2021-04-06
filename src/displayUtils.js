// these helper functions are used by the templates to create static HTML
// and often duplicate what is available in the front-end javascript-driven tables
// someday we'll be able to share the codebase ... 

let calcScore = score => {
    return parseFloat(parseFloat(score).toFixed(2));
};

// let makeScoreSpan = answerSet => 
//     answerSet && answerSet.isTested ? 
//         `<span>${calcScore(answerSet.score)}%</span>` 
//         : 
//         `<span class="not-tested">Not tested</span>`
// ;

const topicNames = {
    "basic-functionality": "Basic Functionality",
    "visual-adjustments": "Visual Adjustments",
    "non-visual-reading": "Non-Visual Reading",
    "read-aloud": "Read Aloud",
    "media-overlays": "Media Overlays",
    "extended-descriptions": "Extended Descriptions",
    "math": "Mathematics"
}

// const resultNames = {
//     "PASS": "Pass",
//     "FAIL": "Fail",
//     "NA": "N/A",
//     "NOANSWER": "No answer"
// };

// function getTopicName(id) {
//     let retval = topicNames.hasOwnProperty(id) ? topicNames[id] : '';
//     return retval;
// }
// function testingEnvironmentLink(testenv, urlpart) {
//     return `
//         <a href="./${urlpart}/${testenv.id}">
//             <span class="sw readingSystem">
//                 <span class="name">${testenv.readingSystem.name}</span>
//                 <span class="version">${testenv.readingSystem.version}</span>
//             </span>
//             ${testenv.hasOwnProperty('assistiveTechnology') && testenv.assistiveTechnology ? 
//                 `<span class="sw assistiveTechnology">
//                     <span class="name">${testenv.assistiveTechnology.name}</span> 
//                     <span class="version">${testenv.assistiveTechnology.version}</span>
//                     </span>`
//                 : 
//                 ``
//             }
//             ${testenv.hasOwnProperty('browser') && testenv.browser ? 
//                 `<span class="sw browser">
//                     <span class="name">${testenv.browser.name}</span> 
//                     <span class="version">${testenv.browser.version}</span>
//                     </span>`
//                 : 
//                 ``
//             }
//             <span class="sw os">
//                 <span class="name">${testenv.os.name}</span>
//                 <span class="version">${testenv.os.version}</span>
//             </span>
//         </a>`;
// }

function getAnswerSetForTopic(testingEnvironment, topicId) {
    return testingEnvironment.answerSets.find(aset => aset.testBook.topic.id === topicId);
}
function isTested(testingEnvironment) {
    return testingEnvironment.answerSets.find(as => as.isTested) != undefined;
}
export {
    // getTopicName,
    // testingEnvironmentLink,
    // resultNames,
    // makeScoreSpan,
    getAnswerSetForTopic,
    isTested
}
