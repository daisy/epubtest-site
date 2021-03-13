import { initDb, assignAnswerSets, loadFirstAnswersAndPublish, upgradeTestSuite, loadSecondAnswers } from "../test/load-data.js";
import winston from "winston";

(async () => {
    winston.add(new winston.transports.Console({format: winston.format.simple()}));
    winston.level = 'debug';
    
    winston.log('info', "Loading data");

    try {
        let dataProfile = {
            langs: "../test/data/langs.json",
            topics: "../test/data/topics.json",
            testBooks: "../test/data/test-books.json",
            software: "../test/data/software.json",
            testingEnvironments: "../test/data/testing-environments.json",
            users: "../test/data/users.json",
            answers: "../test/data/answers-first-set.json",
            upgrade: "./data/upgrade-test-books.json"
        };
        let jwt = await initDb(dataProfile);
        await assignAnswerSets(jwt);
        await loadFirstAnswersAndPublish(jwt, dataProfile);
        await upgradeTestSuite(jwt, dataProfile);
        
        dataProfile.answers = "./data/answers-second-set.json";
        await loadSecondAnswers(jwt, dataProfile);
    }
    catch(err) {
        winston.error(err);
    }
    

    winston.info("Done");
})();