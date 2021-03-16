import * as Q from '../../../src/queries/index.js';
import * as db from "../../../src/database/index.js";
import winston from 'winston';

async function addUsers(data, jwt, errors) {
    winston.info("Adding Users");
    
    for (let user of data) {
        let dbres = await db.query(
            Q.LOGINS.CREATE_NEW_LOGIN(),
            {
                email: user.email,
                password: user.password,
                active: true
            }, 
            jwt
        );
        if (!dbres.success) {
            errors = errors.concat(dbres.errors);
            throw new Error("addUsers error");
        }
        let loginId = dbres.data.createNewLogin.integer;
        dbres = await db.query(
            Q.USERS.CREATE(),  
            {
                input: {
                    name: user.name,
                    loginId
                }
            },
            jwt
        );
        if (!dbres.success) {
            errors = errors.concat(dbres.errors);
            throw new Error("addUsers error");
        }
    }
}

export { addUsers };
