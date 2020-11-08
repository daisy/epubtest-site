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
        await db.query(Q.ETC.DISABLE_TRIGGERS, {}, jwt);

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
        let testBooks = dbres.data.getLatestTestBooks;
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
         // reenable the triggers
        await db.query(Q.ETC.ENABLE_TRIGGERS, {}, jwt);
        // call the function that does what the triggers would have done had they been active
        await db.query(Q.ETC.RUN_ANSWERSET_TRIGGER_OPERATIONS, {}, jwt);
        return {success: false, errors, testingEnvironmentId};
    }

    // reenable the triggers
    await db.query(Q.ETC.ENABLE_TRIGGERS, {}, jwt);
    // call the function that does what the triggers would have done had they been active
    await db.query(Q.ETC.RUN_ANSWERSET_TRIGGER_OPERATIONS, {}, jwt);
    return {success: true, errors, testingEnvironmentId};
}

// remove a testing environment and all its answer sets and answers
async function remove(testingEnvironmentId, jwt) {
    let errors = [];
    try {
        await db.query(Q.ETC.DISABLE_TRIGGERS, {}, jwt);

        // get testing environment
        let dbres = await db.query(
            Q.TESTING_ENVIRONMENTS.GET, 
            { id: testingEnvironmentId }, 
            jwt);
        if (!dbres.success) {
            errors = dbres.errors;
            throw new Error();
        }
        
        let testenv = dbres.data.testingEnvironment;
        for (answerSet of testenv.answerSets) {
            await answerSets.remove(answerSet.id, jwt);
        }
        // delete answers and answer sets
        // let answerSets = testenv.answerSets;
        // for (answerSet of answerSets) {
            
        //     let answers = answerSet.answers;
        //     for (answer of answers) {
        //         dbres = await db.query(Q.ANSWERS.DELETE, 
        //             {id: answer.id}, 
        //             jwt);
        //         if (!dbres.success) {
        //             errors = dbres.errors;
        //             throw new Error();
        //         }
        //     }
        //     dbres = await db.query(Q.ANSWER_SETS.DELETE, 
        //         {id: answerSet.id}, 
        //         jwt);
        //     if (!dbres.success) {
        //         errors = dbres.errors;
        //         throw new Error();
        //     }
        // }
        
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
        // reenable the triggers
        await db.query(Q.ETC.ENABLE_TRIGGERS, {}, jwt);
        // call the function that does what the triggers would have done had they been active
        await db.query(Q.ETC.RUN_ANSWERSET_TRIGGER_OPERATIONS, {}, jwt);
        return {success: false, errors};
    }

    // reenable the triggers
    await db.query(Q.ETC.ENABLE_TRIGGERS, {}, jwt);
    // call the function that does what the triggers would have done had they been active
    await db.query(Q.ETC.RUN_ANSWERSET_TRIGGER_OPERATIONS, {}, jwt);
    return {success: true, errors: []};
}

module.exports = {
    add,
    remove
};