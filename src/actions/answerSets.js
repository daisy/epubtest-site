const db = require('../database');
const Q = require('../queries');
const testBooks = require('./testBooks');
const undo = require('./undo');

// add an answer set for the topic, along with empty answers for all its tests
async function add(testBookId, testingEnvironmentId, jwt) {
    let errors = [];
    let transactions = [];
    let answerSetId;

    try {
        let dbres = await db.query(Q.TEST_BOOKS_WITH_TESTS.GET, {id: testBookId}, jwt);
        if (!dbres.success) {
            errors = dbres.errors;
            throw new Error();
        }
        let testsForBook = dbres.data.testBook.testsByTestBookId.nodes;

        // add an answer set for the book
        dbres = await db.query(
            Q.ANSWER_SETS.CREATE, 
            {
                input: {
                    testBookId,
                    isPublic: false,
                    testingEnvironmentId,
                    score: 0
                }
            }, 
            jwt);

        if (!dbres.success) {
            errors = dbres.errors;
            throw new Error();
        }
        answerSetId = dbres.data.createAnswerSet.answerSet.id;
        transactions.push({objectType: 'ANSWER_SETS', id: answerSetId, actionWas: 'CREATE'});
        
        for (test of testsForBook) {
            dbres = await db.query(
                Q.ANSWERS.CREATE, 
                {
                    input: {
                        testId: parseInt(test.id),
                        answerSetId: parseInt(answerSetId)
                    }
                }, 
                jwt);
            if (!dbres.success) {
                errors = dbres.errors;
                throw new Error();
            }
            transactions.push({objectType: 'ANSWERS', id: dbres.data.createAnswer.id, actionWas: 'CREATE'});
        }
    }
    catch (err) {
        // rollback any new db entries
        await undo(transactions, jwt);
        return {success: false, errors: errors.length > 0 ? errors : [err]};
    }
    return {success: true, errors: [], answerSetId: parseInt(answerSetId)};
}

async function migrate(newAnswerSetId, oldAnswerSetId, jwt) {
    let errors = [];
    let transactions = [];
    try {
        let dbres = await db.query(Q.ANSWER_SETS.GET, {id: newAnswerSetId}, jwt);
        if (!dbres.success) {
            errors = dbres.errors;
            throw new Error();
        }
        let newAnswerSet = dbres.data.answerSet;
        
        dbres = await db.query(Q.ANSWER_SETS.GET, {id: newAnswerSetId}, jwt);
        if (!dbres.success) {
            errors = dbres.errors;
            throw new Error();
        }
        let newAnswers = dbres.data.answerSet.answersByAnswerSetId.nodes;

        dbres = await db.query(Q.ANSWER_SETS.GET, {id: oldAnswerSetId}, jwt);
        if (!dbres.success) {
            errors = dbres.errors;
            throw new Error();
        }
        let oldAnswerSet = dbres.data.answerSet;
        let oldAnswers = dbres.data.answerSet.answersByAnswerSetId.nodes;

        // get the new tests
        dbres = await db.query(Q.TEST_BOOKS_WITH_TESTS.GET, {id: newAnswerSet.testBook.id}, jwt);
        if (!dbres.success) {
            errors = dbres.errors;
            throw new Error();
        }
        let tests = dbres.data.testBook.testsByTestBookId.nodes;
        
        let flaggedAnswer = false;
        // loop through all the tests: for the flagged ones (i.e. new or changed), set the answer.flag = true
        // for the non-flagged ones, copy the old answer value over        
        for (test of tests) {
            // match the answers based on the test's string ID, e.g. "file-010"
            let answer = newAnswers.find(a => a.test.testId === test.testId);
            if (test.flag) {
                
                // flag the answer
                dbres = await db.query(Q.ANSWERS.UPDATE, {
                    id: answer.id,
                    patch: {
                        flag: true
                    } 
                }, 
                jwt);

                if (dbres.success) {
                    flaggedAnswer = true;
                    transactions.push({objectType: 'ANSWERS', actionWas: "UPDATE", id: answer.id, previousState: { flag: answer.flag }});
                }
            }
            else {
                // copy the old answer
                let oldAnswer = oldAnswers.find(a => a.test.testId === test.testId);
                if (oldAnswer) {
                    dbres = await db.query(Q.ANSWERS.UPDATE, {
                        id: answer.id, 
                        patch: {
                            value: oldAnswer.value
                        }}, 
                        jwt);
                    if (dbres.success) {
                        transactions.push({objectType: 'ANSWERS', actionWas: "UPDATE", id: answer.id, previousState: { value: answer.value }});
                    }
                }
            }
        }
        // if there were flagged answers in the new answer set
        // mark it as needing updating
        if (flaggedAnswer) {
            dbres = await db.query(Q.ANSWER_SETS.UPDATE, {
                id: newAnswerSetId,
                patch: {
                    flag: true
                }
            }, jwt);
        }
        // else if no flagging was required, we can assume all the values migrated over because the upgrade was trivial
        // in this case, the visibility of the new answer set can be the same as the old one was
        else {
            dbres = await db.query(Q.ANSWER_SETS.UPDATE, {
                id: newAnswerSetId,
                patch: {
                    isPublic: oldAnswerSet.isPublic
                }
            }, jwt);
        }
    }
    catch (err) {
        await undo(transactions);
        return { success: false, errors: errors.length > 0 ? errors : [err]};
    }
    return { success: true, errors};
}

// call this when we don't need to upgrade
async function createAnswerSetsForNewTestBook(newTestBookId, jwt) {
    let errors = [];
    let dbres = await db.query(Q.TESTING_ENVIRONMENTS.GET_ALL, {}, jwt);
    if (!dbres.success) {
        return dbres;
    }
    let testingEnvironments = dbres.data.testingEnvironments.nodes;

    // pause the triggers
    db.query(Q.ETC.DISABLE_TRIGGERS, {}, jwt);

    for (testingEnvironment of testingEnvironments) {
        let result = await add(newTestBookId, testingEnvironment.id, jwt);
        if (!result.success) {
            errors = errors.concat(result.errors);
        }
    }

    // reenable the triggers
    db.query(Q.ETC.ENABLE_TRIGGERS, {}, jwt);
    // call the function that does what the triggers would have done had they been active
    db.query(Q.ETC.RUN_ANSWERSET_TRIGGER_OPERATIONS, {}, jwt);

    return { success: errors.length === 0, errors };
}

// this might be nice to encapsulate in a postgres function
async function upgrade(newTestBookId, oldTestBookId, jwt) {
    let errors = [];
    // get usage for the old test book
    let usage = await testBooks.getUsage(oldTestBookId, jwt);
    if (!usage.success) {
        return usage; // just pass the status and errors along
    }
    let created = {}; // {oldAnswerSetId: newAnswerSetId}

    // pause the triggers
    db.query(Q.ETC.DISABLE_TRIGGERS, {}, jwt);

    // add new answer sets
    if (usage.answerSets.hasOwnProperty("all")) {
        for (answerSet of usage.answerSets.all) {
            let testEnvId = answerSet.testingEnvironment.id;
            let userId = answerSet.user.id;
            let result = await add(newTestBookId, testEnvId, jwt);
            if (!result.success) {
                errors = errors.concat(result.errors);
            }
            else {
                await assign(result.answerSetId, userId, jwt);
                created[answerSet.id] = result.answerSetId;
            }
        }
    }

    // for books which had non-empty answer sets: migrate answers from the old answer set to the new one
    if (usage.answerSets.hasOwnProperty("nonEmpty")) {
        for (answerSet of usage.answerSets.nonEmpty) {
            let oldAnswerSetId = answerSet.id;
            let newAnswerSetId = created[oldAnswerSetId];
            result = await migrate(newAnswerSetId, oldAnswerSetId, jwt);
            if (!result.success) {
                errors = errors.concat(result.errors);
            }
        }
    }
    // reenable the triggers
    db.query(Q.ETC.ENABLE_TRIGGERS, {}, jwt);
    // call the function that does what the triggers would have done had they been active
    db.query(Q.ETC.RUN_ANSWERSET_TRIGGER_OPERATIONS, {}, jwt);

    return { success: errors.length === 0, errors };
}


async function remove(answerSetId, jwt) {
    let errors = [];
    try {
        let dbres = await db.query(
            Q.ANSWER_SETS.GET,
            { id: answerSetId},
            jwt
        );
        if (!dbres.success) {
            errors = dbres.errors;
            throw new Error();
        }
        let answerSet = dbres.data.answerSet;
        for (answer of answerSet.answersByAnswerSetId.nodes) {
            dbres = await db.query(
                Q.ANSWERS.DELETE, 
                { id: answer.id}, 
                jwt
            );
            if (!dbres.success) {
                errors = errors.concat(dbres.errors);
            }
        }
        // if there are errors at this point, it's because answers couldn't be deleted
        // in this case, don't delete the answer set, otherwise there will be 
        // answers with no owner
        if (errors.length > 0) {
            throw new Error();
        }
        dbres = await db.query(
            Q.ANSWER_SETS.DELETE,
            {id: answerSetId},
            jwt
        );
        if (!dbres.success) {
            throw new Error();
        }
    }
    catch (err) {
        return { success: false, errors: errors.length > 0 ? errors : [err]};
    }
    return { success: true };
}

async function assign(answerSetId, userId, jwt) {
    let dbres = await db.query(
        Q.ANSWER_SETS.UPDATE,
        {
            id: answerSetId,
            patch: {
                userId
            }
        },
        jwt
    );
    return { success: dbres.success, errors: dbres.errors };
}

module.exports = {
    add,
    remove,
    upgrade,
    assign,
    createAnswerSetsForNewTestBook
};