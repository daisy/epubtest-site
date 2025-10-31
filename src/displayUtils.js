import dayjs from 'dayjs';

// these helper functions are used by the templates to create static HTML
// and often duplicate what is available in the front-end javascript-driven tables
// someday we'll be able to share the codebase ... 


const topicNames = {
    "basic-functionality": "Basic Functionality",
    "visual-adjustments": "Visual Adjustments",
    "non-visual-reading": "Non-Visual Reading",
    "read-aloud": "Read Aloud",
    "media-overlays": "Media Overlays",
    "extended-descriptions": "Extended Descriptions",
    "math": "Mathematics"
}

function getAnswerSetForTopic(testingEnvironment, topicId) {
    return testingEnvironment.answerSets.find(aset => aset.testBook.topic.id === topicId);
}
function isTested(testingEnvironment) {
    return testingEnvironment.answerSets.find(as => as.isTested) != undefined;
}
function answerSetCompletedStatus(answerSet) {
    let filledOutAnswers = answerSet.answers.filter(a => a.value != 'NOANSWER');

    if (filledOutAnswers.length != 0 && filledOutAnswers.length != answerSet.answers.length) {
        return {
            class: "",
            message: "Incomplete"
        };
    }
    else if (filledOutAnswers.length == 0) {
        return {
            class: "",
            message: "Not started"
        };
    }
    else if (filledOutAnswers.length == answerSet.answers.length) {
        return {
            class: '',
            message: "Complete"
        };
    }
}
// extract a list of human-readable topic names from an array of answer sets
function listTopics(answerSets) {
    return Array.from(new Set(answerSets.map(aset => topicNames[aset.testBook.topic.id]))).join(', ');
}

export {
    getAnswerSetForTopic,
    isTested,
    topicNames,
    listTopics,
    answerSetCompletedStatus,
    dayjs
}
