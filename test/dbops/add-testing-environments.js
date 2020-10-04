const Q = require("../../src/queries/index");
const db = require("../../src/database");
const testEnvActions = require("../../src/actions/testingEnvironments");
const winston = require("winston");

async function addTestingEnvironments(data, jwt, errmgr) {
    winston.info("Adding Testing Environments");
    let dbres = await db.query(Q.SOFTWARE.GET_ALL_BY_TYPE('ReadingSystem'), {}, jwt);
    let rses = dbres.data.softwares;
    dbres = await db.query(Q.SOFTWARE.GET_ALL_BY_TYPE('AssistiveTechnology'), {}, jwt);
    let ats = dbres.data.softwares;
    dbres = await db.query(Q.SOFTWARE.GET_ALL_BY_TYPE('Os'), {}, jwt);
    let oses = dbres.data.softwares;
        
    for (tenv of data) {
        
        // find IDs for the referenced software
        let rs = rses.find(sw => sw.name === tenv.readingSystemName);
        tenv.readingSystemId = rs.id;
        delete tenv.readingSystemName;

        let at = ats.find(sw => sw.name === tenv.assistiveTechnologyName);
        tenv.assistiveTechnologyId = at.id;
        delete tenv.assistiveTechnologyName;

        let os = oses.find(sw => sw.name === tenv.osName);
        tenv.osId = os.id;
        delete tenv.osName;

        let result = await testEnvActions.add(tenv, jwt);
        if (!result.success) {
            errmgr.addErrors(dbres.errors);
            throw new Error("addTestingEnvironments error");
        }
    }
}

module.exports = addTestingEnvironments;