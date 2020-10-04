const Q = require("../../src/queries/index");
const db = require("../../src/database");
const winston = require("winston");

async function addUsers(data, jwt, errors) {
    winston.info("Adding Users");
    
    for (user of data) {
        let dbres = await db.query(
            Q.LOGINS.CREATE_NEW_LOGIN,
            {
                email: user.email,
                password: user.password 
            }, 
            jwt
        );
        if (!dbres.success) {
            errors = errors.concat(dbres.errors);
            throw new Error("addUsers error");
        }
        let loginId = dbres.data.createNewLogin.integer;
        dbres = await db.query(
            Q.USERS.CREATE, 
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

module.exports = addUsers;
