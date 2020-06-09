const db = require('../database');
const Q = require('../queries');
const answerSets = require('./answerSets');

// add a new testing environment and create answer sets for the topics 
// assign the answer sets to the specified users
// topicsUsers should look like [{topic, user}...] where each value is a topic ID or user ID
async function add(testingEnvironmentInput, topicsUsers, jwt) {
    let errors = [];
    let testingEnvironmentId = -1;
    try {
        let dbres = await db.query(Q.TEST_BOOKS.GET_LATEST);
        if (!dbres.success) {
            errors = dbres.errors;
            throw new Error();
        }
        let testBooks = dbres.data.getLatestTestBooks.nodes;
        dbres = await db.query(Q.TESTING_ENVIRONMENTS.ADD, 
            {
                newTestingEnvironmentInput: {
                    testingEnvironment: testingEnvironmentInput
                }
            }, jwt);
        if (!dbres.success) {
            errors = dbres.errors;
            throw new Error();
        }
        testingEnvironmentId = dbres.data.createTestingEnvironment.testingEnvironment.id;

        let i;
        for (i=0; i<topicsUsers.length; i++) {
            let topicId = topicsUsers[i].topic;
            let book = testBooks.find(tb => tb.topicId === topicId);
            let result = await answerSets.add(book.id, topicsUsers[i].user, testingEnvironmentId, jwt);

            if (!result.success) {
                errors = result.errors;
                throw new Error();
            }
        }   
    }
    catch(err) {
        return {success: false, errors, testingEnvironmentId};
    }

    return {success: true, errors: [], testingEnvironmentId};
}

// remove a testing environment and all its answer sets and answers
async function remove(testingEnvironmentId, jwt) {
    let errors = [];
    try {
        // get testing environment
        let dbres = await db.query(
            Q.TESTING_ENVIRONMENTS.GET_BY_ID, 
            { id: testingEnvironmentId }, 
            jwt);
        if (!dbres.success) {
            errors = dbres.errors;
            throw new Error();
        }
        
        let testenv = dbres.data.testingEnvironment;
        // delete answers and answer sets
        let i, j;
        let answerSets = testenv.answerSetsByTestingEnvironmentId.nodes;
        for (i=0; i<answerSets.length; i++) {
            let answers = answerSets[i].answersByAnswerSetId.nodes;
            for (j=0; j<answers.length; j++) {
                dbres = await db.query(Q.ANSWERS.DELETE, 
                    {id: answers[j].id}, 
                    jwt);
                if (!dbres.success) {
                    errors = dbres.errors;
                    throw new Error();
                }
            }
            dbres = await db.query(Q.ANSWER_SETS.DELETE, 
                {id: answerSets[i].id}, 
                jwt);
            if (!dbres.success) {
                errors = dbres.errors;
                throw new Error();
            }
        }
        
        // delete testing environment
        dbres = await db.query(Q.TESTING_ENVIRONMENTS.DELETE,
            {id: testenv.id},
            jwt);
        if (!dbres.success) {
            errors = dbres.errors;
            throw new Error();
        }
    }
    catch (err) {
        return {success: false, errors};
    }

    return {success: true, errors: []};
}

module.exports = {
    add,
    remove
};