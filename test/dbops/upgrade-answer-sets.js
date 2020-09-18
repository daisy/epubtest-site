const Q = require("../../src/queries/index");
const db = require("../../src/database");
const winston = require("winston");
const answerSetsActions = require('../../src/actions/answerSets');

async function upgradeAnswerSets(newBookId, replacesBookId, jwt) {
    winston.info("Upgrading Answer sets");

    let result = await answerSetsActions.upgrade(newBookId, replacesBookId, jwt);

    if (!result.success) {
        for (err in result.errors) {
            winston.error(err);
        }
    }
}

module.exports = upgradeAnswerSets;
