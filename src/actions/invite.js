const db = require('../database');
const Q = require('../queries');
const utils = require('../utils');
const emails = require('../emails');
const mail = require('./mail');

// admin authorization required
async function inviteUser(userId, jwt) {
    let errors = [];
    try {
        let dbres = await db.query(Q.USERS.GET_EMAIL, {id: parseInt(userId)}, jwt);
        if (!dbres.success) {
            errors = dbres.errors;
            throw new Error();
        }
        let user = dbres.data.user;
                
        dbres = await db.query(
            Q.AUTH.TEMPORARY_TOKEN,
            {
                input: {
                    email: user.login.email
                }
            });
        if (!dbres.success) {
            errors = dbres.errors;
            throw new Error();
        }
        let temporaryJwt = dbres.data.createTemporaryToken.jwtToken;
        let token = utils.parseToken(temporaryJwt);
        if (!token) {
            errors = dbres.errors;
            throw new Error();
        }
        
        let inviteUrl = process.env.NODE_ENV != 'production' ? 
            `http://localhost:${process.env.PORT}/accept-invitation?token=${temporaryJwt}`
            : 
            `http://epubtest.org/accept-invitation?token=${temporaryJwt}`;
        await mail.sendEmail(user.login.email, 
            emails.invite.subject, 
            emails.invite.text(inviteUrl), 
            emails.invite.html(inviteUrl));   
        
        dbres = await db.query(
            Q.INVITATIONS.CREATE, 
            {
                input: {
                    userId: parseInt(userId)
                } 
            },
            jwt);
        
        if (!dbres.success) {
            errors = dbres.errors;
            throw new Error();
        }
    }
    catch(err) {
        return { success: false, errors: errors.length > 0 ? errors : [err]};
    }
    return { success: true, errors };
}

async function resendInvitation(invitationId, jwt) {
    let errors = [];
    // get the user ID for this invitation
    let dbres = await db.query(Q.INVITATIONS.GET, {id: invitationId}, jwt);

    if (!dbres.success) {
        errors = dbres.errors;
        throw new Error();
    }

    let userId = dbres.data.invitation.user.id;

    // then delete the invitation
    await db.query(Q.INVITATIONS.DELETE, {id: invitationId}, jwt);

    // and send a new one
    let res = await inviteUser(userId, jwt);
    return res;
}

async function cancelInvitation(invitationId, jwt) {
    // delete the invitation
    await db.query(Q.INVITATIONS.DELETE, {id: invitationId}, jwt);
}

module.exports = {
    inviteUser,
    resendInvitation,
    cancelInvitation
};