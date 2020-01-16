var express = require('express');
const db = require('../database');
const Q = require('../queries');
var router = express.Router()
const axios = require('axios');

// submit approve request to publish
router.post('/handle-request', async (req, res) => {
    try {
        if (req.body.hasOwnProperty("approve")) {
            await db.queries([
                Q.PUBLISH_ANSWER_SET(req.body.answerSetId), 
                Q.DELETE_REQUEST(req.body.requestId)
            ], req.cookies.jwt);
        }
        else if (req.body.hasOwnProperty("deny")) {
            await db.query(Q.DELETE_REQUEST(req.body.requestId), req.cookies.jwt);
        }
        return res.redirect('/admin/requests');
    }
    catch (err) {
        console.log(err);
        return res.redirect('/server-error');
    }
});

router.post('/invite-user', async (req, res) => {
    try {
        // for all people listed: 
        // - make a person if does not exist
        // - get each user's email
        // - generate a temporary token
        // - email them a URL
    }
    catch(err) {
        console.log(err);
        return res.redirect('/server-error');
    }
})
module.exports = router;