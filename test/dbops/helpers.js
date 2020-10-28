const Q = require("../../src/queries/index");
const db = require("../../src/database");

module.exports.getUserByEmail = async function(email, jwt) {
    let dbres = await db.query(Q.USERS.GET_ALL_EXTENDED, {}, jwt);
    let user = dbres.data.users.filter(u => u.login.email == email);
    return user[0];
}   