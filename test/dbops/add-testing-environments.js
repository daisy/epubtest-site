const Q = require("../../src/queries/index");
const db = require("../../src/database");
const testEnvActions = require("../../src/actions/testingEnvironments");
const winston = require("winston");

async function addTestingEnvironments(data, jwt) {
    winston.info("Adding Testing Environments");
    
    for (tenv of data) {
        await testEnvActions.add(tenv, jwt);
    }

    let dbres = await db.query(
        Q.USERS.GET_ALL,
        {},
        jwt
    );
}

module.exports = addTestingEnvironments;