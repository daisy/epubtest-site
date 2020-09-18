const { initializeDb, assignAnswerSets, loadFirstAnswersAndPublish, upgradeTestSuite, loadSecondAnswersAndPublish } = require("../test/load-data");
const winston = require("winston");

(async () => {
    winston.add(new winston.transports.Console({format: winston.format.simple()}));
    winston.level = 'debug';
    
    winston.log('info', "Loading data (expecting db api endpoint to be running already)");

    let jwt = await initializeDb();
    await assignAnswerSets(jwt);
    await loadFirstAnswersAndPublish(jwt);
    await upgradeTestSuite(jwt);
    await loadSecondAnswersAndPublish(jwt);

    winston.info("Done");
})();