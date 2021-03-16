import * as Q from '../../../src/queries/index.js';
import * as db from "../../../src/database/index.js";
import winston from 'winston';

async function addSoftware(data, jwt, errmgr) {
    winston.info("Adding Software");
    for (let sw of data) {
        let dbres = await db.query(
            Q.SOFTWARE.CREATE(),  
            {
                input: {
                    ...sw
                }
            },
            jwt
        );
        if (!dbres.success) {
            errmgr.addErrors(dbres.errors);
            throw new Error("addSoftware error");
        }
    } 
}

export { addSoftware };