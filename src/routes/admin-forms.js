const express = require('express');
const db = require('../database');
const Q = require('../queries/queries');
const QAUTH = require('../queries/auth');
const QADMIN = require('../queries/admin');
const utils = require('../utils');
const mail = require('../mail');
const router = express.Router()

// submit approve request to publish
router.post('/handle-request', async (req, res) => {
    try {
        if (req.body.hasOwnProperty("approve")) {
            await db.queries([
                QADMIN.PUBLISH_ANSWER_SET(req.body.answerSetId), 
                QADMIN.DELETE_REQUEST(req.body.requestId)
            ], {}, req.cookies.jwt);
        }
        else if (req.body.hasOwnProperty("deny")) {
            await db.query(QADMIN.DELETE_REQUEST(req.body.requestId), {}, req.cookies.jwt);
        }
        return res.redirect('/admin/requests');
    }
    catch (err) {
        console.log(err);
        return res.redirect('/server-error');
    }
});

router.post('/reinvite-users', async (req, res) => {
    try {
        console.log(req.body.users);
        await Promise.all(req.body.users.map(async u => {
            let user = await db.query(Q.USER_EMAIL, {id: parseInt(u.id)}, req.cookies.jwt);
            let result = await db.query(
                QAUTH.TEMPORARY_TOKEN,
                {
                    input: {
                        email: user.data.data.user.login.email
                    }
                });
            let jwt = result.data.data.createTemporaryToken.jwtToken;
            let token = utils.parseToken(jwt);
            if (token) {
                let inviteUrl = process.env.MODE === 'LOCALDEV' ? 
                    `http://localhost:${process.env.PORT}/accept-invitation?token=${jwt}`
                    : 
                    `http://epubtest.org/accept-invitation?token=${jwt}`;
                await mail.emailInvitation(user.data.data.user.login.email, inviteUrl);   
                // TODO
                // create entry in Invitations table 
                return res.redirect('/admin/users');
            }
        }));
    }
    catch(err) {
        console.log(err);
        return res.redirect('/server-error');
    }
})
module.exports = router;