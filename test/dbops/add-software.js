const Q = require("../../src/queries/index");
const db = require("../../src/database");
const winston = require("winston");

async function addSoftware(data, jwt) {
    winston.info("Adding Software");
    for (sw of data) {
        let dbres = await db.query(
            Q.SOFTWARE.CREATE, 
            {
                input: {
                    ...sw
                }
            },
            jwt
        );
    } 
}

module.exports = addSoftware;