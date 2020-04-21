const db = require('../database');
const Q = require('../queries');
const utils = require('../utils');
const emails = require('../emails');
const mail = require('./mail');

// admin authorization required
async function inviteUser(userId, jwt) {
    try {
        let dbres = await db.query(Q.USER_EMAIL, {id: parseInt(userId)}, jwt);
        if (!dbres.success) {
            throw new Error();
        }
        let userEmail = dbres.data.user.login.email;
                
        dbres = await db.query(
            Q.AUTH.TEMPORARY_TOKEN,
            {
                input: {
                    email: userEmail
                }
            });
        if (!dbres.success) {
            throw new Error();
        }
        let temporaryJwt = dbres.data.createTemporaryToken.jwtToken;
        let token = utils.parseToken(temporaryJwt);
        if (!token) {
            throw new Error();
        }
        
        let inviteUrl = process.env.MODE === 'LOCALDEV' ? 
            `http://localhost:${process.env.PORT}/accept-invitation?token=${temporaryJwt}`
            : 
            `http://epubtest.org/accept-invitation?token=${temporaryJwt}`;
        await mail.sendEmail(userEmail, 
            emails.reinvite.subject, 
            emails.reinvite.text(inviteUrl), 
            emails.reinvite.html(inviteUrl));   
        
        dbres = await db.query(
            Q.INVITATIONS.ADD, 
            { 
                input: {
                    invitation: {
                        userId: parseInt(userId)
                    }
                }
            },
            jwt);
        
        if (!dbres.success) {
            throw new Error();
        }
    }
    catch(err) {
        console.log(`Could not create token for user with ID ${userId}.`);
    }
}

module.exports = {
    inviteUser
};