const Q = require("../../src/queries/index");
const db = require("../../src/database");
const winston = require("winston");
const answerSetActions = require('../../src/actions/answerSets');

async function assignAnswerSets(jwt) {
    winston.info("Assigning Answer sets");

    // assign both answer sets to the one non-admin user
    let dbres = await db.query(
        Q.ANSWER_SETS.GET_ALL,
        {},
        jwt
    );
    
    if (!dbres.success) {
        return;
    }
    let answerSets = dbres.data.answerSets.nodes;
    dbres = await db.query(
        Q.USERS.GET_ALL_EXTENDED,
        {},
        jwt);
    if (!dbres.success) {
        return;
    }
    let users = dbres.data.users.nodes;
    let user = users.find(u => u.login.type == 'USER');

    for (answerSet of answerSets) {
        answerSetActions.assign(answerSet.id, user.id, jwt);
    }
}

module.exports = assignAnswerSets;
