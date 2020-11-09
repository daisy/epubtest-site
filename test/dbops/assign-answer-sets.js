const Q = require("../../src/queries/index");
const db = require("../../src/database");
const winston = require("winston");
const answerSetActions = require('../../src/actions/answerSets');

async function assignAnswerSets(jwt, errors) {
    winston.info("Assigning Answer sets");

    // assign both answer sets to the one non-admin user
    let dbres = await db.query(
        Q.ANSWER_SETS.GET_ALL,
        {},
        jwt
    );
    
    if (!dbres.success) {
        errors = errors.concat(dbres.errors);
        throw new Error("addAnswerSets error");
    }
    let answerSets = dbres.data.answerSets;
    dbres = await db.query(
        Q.USERS.GET_ALL_EXTENDED,
        {},
        jwt);
    if (!dbres.success) {
        errors = errors.concat(dbres.errors);
        throw new Error("addAnswerSets error");
    }
    let users = dbres.data.users;
    users = users.filter(u => u.login.type == 'USER');

    let userIdx = 0;
    for (answerSet of answerSets) {
        // cycle through the available users
        if (userIdx > users.length - 1) {
            userIdx = 0;
        }
        let user = users[userIdx];
        dbres = await answerSetActions.assign(answerSet.id, user.id, jwt);
        userIdx++;
        if (!dbres.success) {
            errors = errors.concat(dbres.errors);
            throw new Error("addAnswerSets error");
        }
    }
}

module.exports = assignAnswerSets;
