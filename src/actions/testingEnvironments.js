const db = require('../database');
const Q = require('../queries');
const answerSets = require('./answerSets');
const undo = require('./undo');

// add a new testing environment and create answer sets for the topics 
async function add(testingEnvironmentInput, jwt) {
    let errors = [];
    let transactions = [];
    let testingEnvironmentId;
    try {
        let dbres = await db.query(
            Q.TESTING_ENVIRONMENTS.CREATE, 
            {
                input: {
                    ...testingEnvironmentInput
                }
            }, 
            jwt);
        if (!dbres.success) {
            errors = dbres.errors;
            throw new Error();
        }
        testingEnvironmentId = dbres.data.createTestingEnvironment.testingEnvironment.id; 
        transactions.push({objectType: 'TESTING_ENVIRONMENTS', actionWas: 'CREATE', id: testingEnvironmentId});

        // create answer sets for all topics
        // don't assign them to a user yet
        // dbres = await db.query(
        //     Q.TOPICS.GET_ALL,
        //     {},
        //     jwt);
        // if (!dbres.success) {
        //     errors = dbres.errors;
        //     throw new Error();
        // }
        // let topics = dbres.data.topics.nodes;
        // for (topic of topics) {
            
        // create answer sets for each of the latest test books
        // don't assign them to a user yet
        dbres = await db.query(
            Q.TEST_BOOKS.GET_LATEST,
            {},
            jwt);
        if (!dbres.success) {
            errors = dbres.errors;
            throw new Error();
        }
        let testBooks = dbres.data.getLatestTestBooks.nodes;
        for (testBook of testBooks) {
            let result = await answerSets.add(testBook.id, testingEnvironmentId, jwt);
            if (!result.success) {
                errors = result.errors;
                throw new Error();
            }
        }
    }
    catch(err) {
        undo(transactions, jwt);
        return {success: false, errors, testingEnvironmentId};
    }

    return {success: true, errors, testingEnvironmentId};
}

// remove a testing environment and all its answer sets and answers
async function remove(testingEnvironmentId, jwt) {
    let errors = [];
    try {
        // get testing environment
        let dbres = await db.query(
            Q.TESTING_ENVIRONMENTS_WITH_ANSWERS.GET, 
            { id: testingEnvironmentId }, 
            jwt);
        if (!dbres.success) {
            errors = dbres.errors;
            throw new Error();
        }
        
        let testenv = dbres.data.testingEnvironment;
        // delete answers and answer sets
        let answerSets = testenv.answerSetsByTestingEnvironmentId.nodes;
        for (answerSet of answerSets) {
            let answers = answerSet.answersByAnswerSetId.nodes;
            for (answer of answers) {
                dbres = await db.query(Q.ANSWERS.DELETE, 
                    {id: answer.id}, 
                    jwt);
                if (!dbres.success) {
                    errors = dbres.errors;
                    throw new Error();
                }
            }
            dbres = await db.query(Q.ANSWER_SETS.DELETE, 
                {id: answerSet.id}, 
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