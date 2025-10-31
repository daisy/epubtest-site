import * as Q from '../../../src/queries/index.js';
import * as db from "../../../src/database/index.js";
import * as testEnvActions from "../../../src/actions/testingEnvironments.js";
import winston from 'winston';

async function addTestingEnvironments(data, jwt, errmgr) {
    winston.info("Adding Testing Environments");
    let dbres = await db.query(Q.SOFTWARE.GET_ALL_BY_TYPE('ReadingSystem'), {}, jwt);
    let rses = dbres.data.softwares;
    dbres = await db.query(Q.SOFTWARE.GET_ALL_BY_TYPE('AssistiveTechnology'), {}, jwt);
    let ats = dbres.data.softwares;
    dbres = await db.query(Q.SOFTWARE.GET_ALL_BY_TYPE('Os'), {}, jwt);
    let oses = dbres.data.softwares;
    dbres = await db.query(Q.SOFTWARE.GET_ALL_BY_TYPE('Browser'), {}, jwt);
    let browsers = dbres.data.softwares;
    dbres = await db.query(Q.SOFTWARE.GET_ALL_BY_TYPE("Device"), {}, jwt);
    let devices = dbres.data.softwares;
    
    for (let tenv of data) {
        
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

        let browser = browsers.find(sw => sw.name === tenv.browserName);
        if (browser) {
            tenv.browserId = browser.id;
            delete tenv.browserName;
        }        

        let device = devices.find(sw => sw.name === tenv.deviceName);
        if (device){
            tenv.deviceId = device.id;
            delete tenv.deviceName;
        }

        let result = await testEnvActions.add(tenv, jwt);
        if (!result.success) {
            errmgr.addErrors(dbres.errors);
            throw new Error("addTestingEnvironments error");
        }
    }
}

export { addTestingEnvironments };