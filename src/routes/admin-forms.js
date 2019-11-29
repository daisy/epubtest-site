var express = require('express');
const db = require('../database');
const Q = require('../queries');
var router = express.Router()
const axios = require('axios');

// submit approve request to publish
router.post('/approve-request', (req, res) => {
    axios.all([
        axios(db.makeRequest(Q.PUBLISH_ANSWER_SET(req.body.answerSetId), req.cookies.jwt)), 
        axios(db.makeRequest(Q.DELETE_REQUEST(req.body.requestId), req.cookies.jwt))
    ])
    .then(results => {
        return res.redirect('/admin');
    })
    .catch(err => {
        console.log(err);
        return res.redirect('/server-error');
    });
});

module.exports = router;