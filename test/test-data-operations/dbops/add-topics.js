import * as Q from '../../../src/queries/index.js';
import * as db from "../../../src/database/index.js";
import winston from 'winston';

async function addTopics(data, jwt, errors) {
    winston.info("Adding Topics");
    
    for (let topic of data) {
        let dbres = await db.query(
            Q.TOPICS.CREATE(),  
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

export { addTopics };