const db = require('./database');
const Q = require('./queries');
const utils = require('./utils');
const emails = require('./emails');
const mail = require('./mail');

async function inviteUser(userId, adminJwt) {
    let user = await db.query(Q.USER_EMAIL, {id: parseInt(userId)}, adminJwt);
    let userEmail = user.data.data.user.login.email;
            
    let result = await db.query(
        Q.AUTH.TEMPORARY_TOKEN,
        {
            input: {
                email: userEmail
            }
        });
    let jwt = result.data.data.createTemporaryToken.jwtToken;
    let token = utils.parseToken(jwt);
    if (token) {
        let inviteUrl = process.env.MODE === 'LOCALDEV' ? 
            `http://localhost:${process.env.PORT}/accept-invitation?token=${jwt}`
            : 
            `http://epubtest.org/accept-invitation?token=${jwt}`;
        await mail.sendEmail(userEmail, 
            emails.reinvite.subject, 
            emails.reinvite.text(inviteUrl), 
            emails.reinvite.html(inviteUrl));   
        
        await db.query(
            Q.INVITATIONS.ADD, 
            { 
                input: {
                    invitation: {
                        userId: parseInt(userId)
                    }
                }
            },
            adminJwt);
    }
    else {
        console.log(`Could not create token for user with ID ${userId}`);
    }
}

module.exports = {
    inviteUser
};