const express = require('express');
const db = require('../database');
const Q = require('../queries/queries');
const QADMIN = require('../queries/admin');
const router = express.Router()
const invite = require('../invite');

// submit approve request to publish
router.post('/handle-request', async (req, res) => {
    try {
        if (req.body.hasOwnProperty("approve")) {
            await db.queries([
                QADMIN.PUBLISH_ANSWER_SET, 
                QADMIN.DELETE_REQUEST
            ], 
            [
                { answerSetId: req.body.answerSetId },
                { requestId: req.body.requestId }
            ], 
            req.cookies.jwt);
        }
        else if (req.body.hasOwnProperty("deny")) {
            await db.query(
                QADMIN.DELETE_REQUEST, 
                { requestId: req.body.requestId }, 
                req.cookies.jwt);
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
        // await Promise.all(req.body.users.map(async u => {
        //     await invite.inviteUser(u);
        // }));
        req.body.users.reduce( async (previousPromise, nextValue) => {
            await previousPromise;
            return invite.inviteUser(nextValue.id, req.cookies.jwt);
        }, Promise.resolve());

        return res.redirect('/admin/users');
    }
    catch(err) {
        console.log(err);
        return res.redirect('/server-error');
    }
});
module.exports = router;