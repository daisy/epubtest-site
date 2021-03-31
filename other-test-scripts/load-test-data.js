import { initDb, assignAnswerSets, loadFirstAnswersAndPublish, upgradeTestSuite, loadSecondAnswers } from "../test/test-data-operations/load-data.js";
import winston from "winston";

(async () => {
    winston.add(new winston.transports.Console({format: winston.format.simple()}));
    winston.level = 'debug';
    
    winston.log('info', "Loading data");

    try {
        let dataProfile = {
            langs: "./data/langs.json",
            topics: "./data/topics.json",
            testBooks: "./data/test-books.json",
            software: "./data/software.json",
            testingEnvironments: "./data/testing-environments.json",
            users: "./data/users.json",
            answers: "./data/answers-first-set.json",
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