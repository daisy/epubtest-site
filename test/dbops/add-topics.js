const Q = require("../../src/queries/index");
const db = require("../../src/database");
const winston = require("winston");

async function addTopics(data, jwt) {
    winston.info("Adding Topics");
    
    for (topic of data) {
        let dbres = await db.query(
            Q.TOPICS.CREATE, 
            {
                input: {
                    ...topic
                }
            },
            jwt
        );
    }
}

module.exports = addTopics;