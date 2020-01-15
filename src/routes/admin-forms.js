var express = require('express');
const db = require('../database');
const Q = require('../queries');
var router = express.Router()
const axios = require('axios');

// submit approve request to publish
router.post('/approve-request', async (req, res) => {
    try {
        await db.queries([
            Q.PUBLISH_ANSWER_SET(req.body.answerSetId), 
            Q.DELETE_REQUEST(req.body.requestId)
        ], req.cookies.jwt);
        return res.redirect('/admin');
    }
    catch (err) {
        console.log(err);
        return res.redirect('/server-error');
    }
    // axios.all([
    //     axios(db.makeRequest(Q.PUBLISH_ANSWER_SET(req.body.answerSetId), req.cookies.jwt)), 
    //     axios(db.makeRequest(Q.DELETE_REQUEST(req.body.requestId), req.cookies.jwt))
    // ])
    // .then(results => {
    //     return res.redirect('/admin');
    // })
    // .catch(err => {
    //     console.log(err);
    //     return res.redirect('/server-error');
    // });
});

router.post('/invite-user', async (req, res) => {
    try {
        // find the user's email
        // generate a temporary token
        // email them a URL
    }
    catch(err) {
        console.log(err);
        return res.redirect('/server-error');
    }
})
module.exports = router;