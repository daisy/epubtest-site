const Q = require("../../src/queries/index");
const db = require("../../src/database");
const winston = require("winston");

async function addTopics(data, jwt, errors) {
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
        if (!dbres.success) {
            errors = errors.concat(dbres.errors);
            throw new Error("addTopics error");
        }
    }
}

module.exports = addTopics;