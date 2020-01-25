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

router.post('/publish', async (req, res) => {

    await db.query(
        QADMIN.PUBLISH_ANSWER_SET,
        { answerSetId: parseInt(req.body.answerSetId) },
        req.cookies.jwt);
    
    // also clear any requests for publishing that this answer set might have had
    let requests = await db.query(
        Q.REQUESTS_FOR_ANSWERSETS, 
        { ids: [parseInt(req.body.answerSetId)]},
        req.cookies.jwt
    );

    if (requests && requests.data.data.requests.nodes.length > 0) {
        await db.query(
            QADMIN.DELETE_REQUEST, 
            { requestId: requests.data.data.requests.nodes[0].id }, 
            req.cookies.jwt);
    }

    return res.redirect('/admin/testing');
});

router.post('/unpublish', async (req, res) => {
    await db.query(
        QADMIN.UNPUBLISH_ANSWER_SET,
        { answerSetId: parseInt(req.body.answerSetId) },
        req.cookies.jwt);
    
    return res.redirect('/admin/testing');
});

router.post('/archive', async (req, res) => {
    await db.query(
        QADMIN.ARCHIVE_TESTING_ENVIRONMENT,
        { answerSetId: parseInt(req.body.testingEnvironmentId) },
        req.cookies.jwt);
    
    return res.redirect('/admin/testing');
});

router.post ('/unarchive', async (req, res) => {
    await db.query(
        QADMIN.UNARCHIVE_TESTING_ENVIRONMENT,
        { id: parseInt(req.body.testingEnvironmentId) },
        req.cookies.jwt);
    
    return res.redirect('/admin/testing');
});

router.post('/reinvite-users', async (req, res) => {
    try {
        let i;
        for (i = 0; i<req.body.users.length; i++) {
            await invite.inviteUser(req.body.users[i], req.cookies.jwt);
        }

        return res.redirect('/admin/users');
    }
    catch(err) {
        console.log(err);
        return res.redirect('/server-error');
    }
});
module.exports = router;