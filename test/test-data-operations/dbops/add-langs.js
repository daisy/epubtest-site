import * as Q from '../../../src/queries/index.js';
import * as db from "../../../src/database/index.js";
import winston from 'winston';

async function addLangs(data, jwt, errmgr) {
    winston.info("Adding Langs");
    
    for (let language of data) {
        let dbres = await db.query(
            Q.LANGS.CREATE(),  
            {
                input: {
                    id: language.id,
                    label: language.label
                }
            },
            jwt
        );
        if (!dbres.success) {
            errmgr.addErrors(dbres.errors);
            throw new Error("addLangs error");
        }
    }
}

export { addLangs };