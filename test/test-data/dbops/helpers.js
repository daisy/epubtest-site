import * as Q from '../../../src/queries/index.js';
import * as db from "../../../src/database/index.js";

async function getUserByEmail (email, jwt) {
    let dbres = await db.query(Q.USERS.GET_ALL_EXTENDED(), {}, jwt);
    let user = dbres.data.users.filter(u => u.login.email == email);
    return user[0];
}   

export { getUserByEmail };