import * as Q from '../../../src/queries/index.js';
import * as db from "../../../src/database/index.js";
import * as answerSetActions from '../../../src/actions/answerSets.js';
import winston from 'winston';


async function assignAnswerSets(jwt, errors) {
    winston.info("Assigning Answer sets");

    // assign both answer sets to the one non-admin user
    let dbres = await db.query(
        Q.ANSWER_SETS.GET_ALL(), 
        {},
        jwt
    );
    
    if (!dbres.success) {
        errors = errors.concat(dbres.errors);
        throw new Error("addAnswerSets error");
    }
    let answerSets = dbres.data.answerSets;
    dbres = await db.query(
        Q.USERS.GET_ALL_EXTENDED(),
        {},
        jwt);
    if (!dbres.success) {
        errors = errors.concat(dbres.errors);
        throw new Error("addAnswerSets error");
    }
    let users = dbres.data.users;
    users = users.filter(u => u.login.type == 'USER');

    let userIdx = 0;
    for (let answerSet of answerSets) {
        // cycle through the available users
        if (userIdx > users.length - 1) {
            userIdx = 0;
        }
        let user = users[userIdx];
        dbres = await answerSetActions.assign(answerSet.id, user.id, jwt);
        userIdx++;
        if (!dbres.success) {
            errors = errors.concat(dbres.errors);
            throw new Error("addAnswerSets error");
        }
    }
}

export { assignAnswerSets };
