// it would be nice to use mocha but it's having issues, perhaps related to the async setup
// TODO figure it out later :) 

const { initDb } = require("./init-db");
const winston = require("winston");
const Q = require("../src/queries/index");
const db = require("../src/database");

(async () => {

    winston.add(new winston.transports.Console({format: winston.format.simple()}));
    winston.level = 'debug';
    
    let jwt = await initDb();
    if (jwt) {
        let dbres = await db.query(Q.USERS.GET_ALL, {}, jwt)
        if (dbres.data?.users.length == 2) {
            winston.log('info', "Has 2 users");
        }
        else {
            winston.error('Users error');
        }
    }
    else {
        winston.error("Could not get authentication token");
    }
    

})();