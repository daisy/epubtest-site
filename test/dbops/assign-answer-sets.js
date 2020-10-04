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
    let answerSets = dbres.data.answerSets.nodes;
    dbres = await db.query(
        Q.USERS.GET_ALL_EXTENDED,
        {},
        jwt);
    if (!dbres.success) {
        errors = errors.concat(dbres.errors);
        throw new Error("addAnswerSets error");
    }
    let users = dbres.data.users.nodes;
    let user = users.find(u => u.login.type == 'USER');

    for (answerSet of answerSets) {
        dbres = await answerSetActions.assign(answerSet.id, user.id, jwt);
        if (!dbres.success) {
            errors = errors.concat(dbres.errors);
            throw new Error("addAnswerSets error");
        }
    }
}

module.exports = assignAnswerSets;
