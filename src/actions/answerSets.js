const db = require('../database');
const Q = require('../queries');

// add an answer set for the test book, along with empty answers for all its tests
async function add(testBookId, userId, testingEnvironmentId, jwt) {

    let errors = [];
    // get all the tests in the book
    let dbres = await db.query(Q.TESTS.GET_FOR_BOOK, {
        testBookId: book.id
    });
    if (!dbres.success) {
        errors = dbres.errors;
        return {success: false, errors};
    }
    let testsForBook = dbres.data.tests.nodes;

    // add an answer set for the book
    dbres = await db.query(Q.ANSWER_SETS.ADD, {
        newAnswerSetInput: {
            answerSet:{
                testBookId,
                userId,
                isPublic: false,
                testingEnvironmentId,
                score: 0
            }
        }
    }, jwt);

    if (!dbres.success) {
        errors = dbres.errors;
        return {success: false, errors};
    }
    let answerSetId = dbres.data.createAnswerSet.answerSet.id;

    let j;
    for (j = 0; j<testsForBook.length; j++) {
        dbres = await db.query(Q.ANSWERS.ADD, {
            newAnswerInput: {
                answer: {
                    testId: parseInt(testsForBook[j].id),
                    answerSetId: parseInt(answerSetId)
                }
            }}, 
            jwt);
        if (!dbres.success) {
            errors = errors.concat(dbres.errors);
        }
    }
    if (errors.length > 0) {
        return {success: false, errors}
    }
    return {success: true, errors: [], answerSetId: parseInt(answerSetId)}
}

async function migrate(newAnswerSetId, oldAnswerSetId, jwt) {
    let dbres = await db.query(Q.ANSWER_SETS.GET_BY_ID, {id: newAnswerSetId}, jwt);
    if (!dbres.success) {
        return {success: false};
    }
    let newAnswerSet = dbres.data.answerSet;
    
    dbres = await db.query(Q.ANSWERS.GET_FOR_ANSWER_SET, {answerSetId: newAnswerSetId}, jwt);
    if (!dbres.success) {
        return {success: false};
    }
    let newAnswers = dbres.data.answers.nodes;

    dbres = await db.query(Q.ANSWERS.GET_FOR_ANSWER_SET, {answerSetId: oldAnswerSetId});
    if (!dbres.success) {
        return {success: false};
    }
    let oldAnswers = dbres.data.answers.nodes;

    // get the new tests
    dbres = await db.query(Q.TESTS.GET_FOR_BOOK, {testBookId: newAnswerSet.testBook.id}, jwt);
    if (!dbres.success) {
        return {success: false};
    }
    let tests = dbres.data.tests.nodes;
    
    let i;
    // loop through all the tests: for the flagged ones (i.e. new or changed), clear the answer and set answer.flag = true
    // for the non-flagged ones, copy the old answer over        
    for (i=0; i<tests.length; i++) {
        // match the answers based on the test's string ID, e.g. "file-010"
        let answer = newAnswers.find(a => a.test.testId === tests[i].testId);
        if (tests[i].flag) {
            dbres = await db.query(Q.ANSWERS.FLAG, {answerId: answer.id});
        }
        else {
            // copy the old answer
            let oldAnswer = oldAnswers.find(a => a.test.testId === tests[i].testId);
            if (oldAnswer) {
                dbres = await db.query(Q.ANSWERS.UPDATE, {answerId: answer.id, value: oldAnswer.value});
            }
        }
    }
}

module.exports = {
    add,
    migrate
};