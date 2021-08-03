import * as Q from '../../src/queries/index.js';
import * as db from "../../src/database/index.js";
import * as invite from '../../src/actions/invite.js';

import { initDb, errmgr as loadDataErrors } from './load-data.js';
import chai from 'chai';
const expect = chai.expect;
import winston from 'winston';

let jwt;

describe('invite-users', function () {
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
        await invite.createUserAndInvite("Test User", "test@example.com", jwt);
    });
    
    describe('invite a new user', function () {
        it("has an invitation for the user", async function() {
            let dbres = await db.query(Q.INVITATIONS.GET_ALL(), {}, jwt);
            let invitedEmails = dbres.data.invitations.map(item => item.user.login.email);
            expect(invitedEmails).to.contain("test@example.com");
        });
    });

    describe("resend an invitation", async function() {
        before(async function() {
            let dbres = await db.query(Q.USERS.GET_ALL_EXTENDED(), {}, jwt);
            let users = dbres.data.users;
            let user = users.find(u => u.login.email == "test@example.com");
            let userId = user.id;
            dbres = await db.query(Q.INVITATIONS.GET_FOR_USER(), {userId}, jwt);
            let invitationId = dbres.data.invitations[0].id;
            await invite.resendInvitationToUser(invitationId, jwt);
        });
        it("has one invitation for the user", async function() {
            let dbres = await db.query(Q.INVITATIONS.GET_ALL(), {}, jwt);
            let invitedEmails = dbres.data.invitations.filter(item => item.user.login.email == "test@example.com");
            expect(invitedEmails.length).to.equal(1);
        });
    });

    describe('cancel an invitation', function () {
        let userId;
        before(async function() {
            // cancel the invitation and stash the user ID
            let dbres = await db.query(Q.USERS.GET_ALL_EXTENDED(), {}, jwt);
            let users = dbres.data.users;
            let user = users.find(u => u.login.email == "test@example.com");
            userId = user.id;
            dbres = await db.query(Q.INVITATIONS.GET_FOR_USER(), {userId}, jwt);
            let invitationId = dbres.data.invitations[0].id;
            await invite.cancelInvitation(invitationId, jwt);
        });
        it("removed the invitation", async function() {
            let dbres = await db.query(Q.INVITATIONS.GET_ALL(), {}, jwt);
            let invitedEmails = dbres.data.invitations.map(item => item.user.login.email);
            expect(invitedEmails).to.not.contain("test@example.com");
        });
        it("removed the user", async function() {
            let dbres = await db.query(Q.USERS.GET_ALL_EXTENDED(), {}, jwt);
            let users = dbres.data.users;
            let userIds = users.map(u => u.id);
            expect(userIds).to.not.contain(userId);
        });
        it("removed the login", async function() {
            let dbres = await db.query(Q.LOGINS.GET_ALL(), {}, jwt);
            let logins = dbres.data.logins;
            let loginEmails = logins.map(item => item.email);
            expect(loginEmails).to.not.contain("test@example.com");
        });
    });

    
});

