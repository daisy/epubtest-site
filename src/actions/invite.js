import * as db from '../database/index.js';
import * as Q from '../queries/index.js';
import * as utils from '../utils.js';
import * as emails from '../emails.js';
import * as mail from './mail.js';

// creates the login, the user, and sends the invite
async function createUserAndInvite(name, email, jwt) {
    let errors = [];
    try {
        // create new inactive login
        let dbres = await db.query(
            Q.LOGINS.CREATE_NEW_LOGIN(), 
            {
                email,
                password: '',
                active: false
            },
            jwt
        );

        if (!dbres.success) {
            errors = dbres.errors;
            let message = `Could not create invitation: ${dbres.errors.map(err => err.message).join(', ')}`;
            throw new Error(message);
        }
        let loginId = dbres.data.createNewLogin.integer;

        // create new user (will default to type = 'USER')
        dbres = await db.query(
            Q.USERS.CREATE(),  
            {
                input: {
                    name,
                    loginId
                }
            },
            jwt
        );

        if (!dbres.success) {
            errors = dbres.errors;
            let message = `Could not create invitation`;
            throw new Error(message);
        }
        let userId = dbres.data.createUser.user.id;

        // create an invitation
        dbres = await db.query(
            Q.INVITATIONS.CREATE(),  
            {
                input: {
                    userId: parseInt(userId)
                } 
            },
            jwt);
        
        if (!dbres.success) {
            errors = dbres.errors;
            throw new Error("Could not create invitation");
        }

        // send invitation
        dbres = await sendInvitationToUser(userId, jwt);
        if (!dbres.success) {
            errors = dbres.errors;
            let message = `Could not create invitation`;
            throw new Error(message);
        }
        return {success: true, errors};
    }
    catch (err) {
        errors.push(err);
        return {success: false, errors};
    }
}

// send an invite to an existing user
async function sendInvitationToUser(userId, jwt) {
    let errors = [];
    try {
        let dbres = await db.query(Q.USERS.GET_EMAIL(), {id: parseInt(userId)}, jwt);
        if (!dbres.success) {
            errors = dbres.errors;
            throw new Error();
        }
        let user = dbres.data.user;
                
        // get a token
        dbres = await db.query(
            Q.AUTH.TEMPORARY_TOKEN(),
            {
                input: {
                    email: user.login.email,
                    duration: '7 days'
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
    }
    catch(err) {
        errors.push(err);
        return { success: false, errors};
    }
    return { success: true, errors };
}

async function resendInvitationToUser(invitationId, jwt) {
    let errors = [];
    // get the user ID for this invitation
    let dbres = await db.query(Q.INVITATIONS.GET(), {id: invitationId}, jwt);

    if (!dbres.success) {
        errors = dbres.errors;
        throw new Error();
    }

    let userId = dbres.data.invitation.user.id;

    // then delete the invitation
    await db.query(Q.INVITATIONS.DELETE(),  {id: invitationId}, jwt);

    // and send a new one
    let res = await sendInvitationToUser(userId, jwt);
    return res;
}

async function cancelInvitation(invitationId, jwt) {
    // delete the invitation
    await db.query(Q.INVITATIONS.DELETE(),  {id: invitationId}, jwt);

    // TODO if the user was not migrated from the old website, delete their user and login entries
}

export {
    createUserAndInvite,
    sendInvitationToUser,
    resendInvitationToUser,
    cancelInvitation
};