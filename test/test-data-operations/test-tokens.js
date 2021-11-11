import * as Q from '../../src/queries/index.js';
import * as db from "../../src/database/index.js";
import * as invite from '../../src/actions/invite.js';
import * as utils from '../../src/utils.js';
import fs from 'fs-extra';
import * as path from 'path';

import { initDb, errmgr as loadDataErrors } from './load-data.js';
import chai from 'chai';
const expect = chai.expect;
import winston from 'winston';
import dayjs from "dayjs";

let jwt;

describe('test temporary tokens', function () {
    this.timeout(5000);
    before(async function () {
        winston.add(new winston.transports.Console({format: winston.format.simple()}));
        winston.level = 'debug';
        let dataProfile = {
            langs: "./data/langs.json",
            topics: "./data/topics.json",
            testBooks: "./data/test-books.json",
            software: "./data/software.json",
            testingEnvironments: "./data/testing-environments.json",
            users: "./data/users.json"
        };
        jwt = await initDb(dataProfile); 
    });

    it('create valid tokens', async function() {
        
        let createToken = async (duration) => {
            let dbres = await db.query(
                Q.AUTH.TEMPORARY_TOKEN(),
                {
                    input: {
                        email: '',
                        duration
                    }
                });
            if (!dbres.success) {
                errors = dbres.errors;
                throw new Error();
            }
            let temporaryJwt = dbres.data.createTemporaryToken.jwtToken;
            return temporaryJwt;
        };

        let tokens = [
            {
                duration: '7 days',
                created: new Date()
            },
            {
                duration: '365 days',
                created: new Date()
            },
            {
                duration: '4 hours',
                created: new Date()
            },
            {
                duration: '1 minutes',
                created: new Date()
            }
        ];

        for (let token of tokens) {
            let retval = await createToken(token.duration);
            token.token = retval;
        };

        await Promise.all(tokens.map(token => {
            let parsedToken = utils.parseToken(token.token);
            expect(parsedToken).not.to.be.null;
        }));

        await fs.writeFile(path.join(process.cwd(), "test-tokens.json"), JSON.stringify(tokens));
    });
    
    // run this function on its own later (be sure to not run the creation function above again or it will reset the tokens)
    // see that the tokens still work
    it('can validate those tokens later', function () {
        let contents = fs.readFileSync(path.join(process.cwd(), "test-tokens.json"), "utf-8");
        let tokens = JSON.parse(contents);
        tokens.map(token => {
            let parsedToken = utils.parseToken(token.token);
            let [amt, what] = token.duration.split(' ');
            let exp = dayjs(token.created).add(parseInt(amt), what).valueOf();
            if (exp < dayjs().valueOf()) {
                expect(parsedToken).to.be.null;
            }
            else {
                expect(parsedToken).to.not.be.null;
            }
        });
    });
    
});

