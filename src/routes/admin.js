var express = require('express');
const db = require('../database');
const Q = require('../queries');
const axios = require('axios');

var router = express.Router()

// admin page
router.get('/', (req, res) => {
    axios.all([
        axios(db.makeRequest(Q.REQUESTS, req.cookies.jwt)), 
        axios(db.makeRequest(Q.ALL_TESTING_ENVIRONMENTS, req.cookies.jwt))
    ])
    .then(results => {
        let requests = results[0].data.data.requests.nodes;
        let testenvs = results[1].data.data.testingEnvironments.nodes;
        return res.render('./admin.html', 
            {
                accessLevel: req.accessLevel,
                requests: requests,
                testingEnvironments: testenvs,
                getRequestToPublish: answerSetId => {
                    let retval = requests.find(r => r.answerSetId === answerSetId);
                    return retval;
                }
            });
    })  
    .catch(err => {
        console.log(err);
        return res.redirect('/server-error');
    });
});

module.exports = router;