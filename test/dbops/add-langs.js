const Q = require("../../src/queries/index");
const db = require("../../src/database");
const winston = require("winston");

async function addLangs(data, jwt) {
    winston.info("Adding Langs");
    for (language of data) {
        let dbres = await db.query(
            Q.LANGS.CREATE, 
            {
                input: {
                    id: language.id,
                    label: language.label
                }
            },
            jwt
        );
    }
}

module.exports = addLangs;