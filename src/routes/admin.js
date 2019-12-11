var express = require('express');
const db = require('../database');
const Q = require('../queries');
const axios = require('axios');

var router = express.Router()

// admin requests
router.get('/requests', (req, res) => {
    db.query(Q.REQUESTS, req.cookies.jwt)
    .then(results => {
        let requests = results.data.data.requests.nodes;
        return res.render('./admin/requests.html', 
            {
                accessLevel: req.accessLevel,
                requests: requests
            });
    })  
    .catch(err => {
        console.log(err);
        return res.redirect('/server-error');
    });
});

// admin testing
router.get('/testing', (req, res) => {
    axios.all([
        axios(db.makeRequest(Q.REQUESTS, req.cookies.jwt)), 
        axios(db.makeRequest(Q.ALL_TESTING_ENVIRONMENTS, req.cookies.jwt))
    ])
    .then(results => {
        let requests = results[0].data.data.requests.nodes;
        let testenvs = results[1].data.data.testingEnvironments.nodes;
        return res.render('./admin/testing.html', 
            {
                accessLevel: req.accessLevel,
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


// admin test books
router.get('/test-books', (req, res) => {
    axios.all([
        axios(db.makeRequest(Q.REQUESTS, req.cookies.jwt)), 
        axios(db.makeRequest(Q.ALL_TESTING_ENVIRONMENTS, req.cookies.jwt))
    ])
    .then(results => {
        let requests = results[0].data.data.requests.nodes;
        let testenvs = results[1].data.data.testingEnvironments.nodes;
        return res.render('./admin/testing.html', 
            {
                accessLevel: req.accessLevel,
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

// admin users
router.get('/users', (req, res) => {
    axios.all([
        axios(db.makeRequest(Q.REQUESTS, req.cookies.jwt)), 
        axios(db.makeRequest(Q.ALL_TESTING_ENVIRONMENTS, req.cookies.jwt))
    ])
    .then(results => {
        let requests = results[0].data.data.requests.nodes;
        let testenvs = results[1].data.data.testingEnvironments.nodes;
        return res.render('./admin/users.html', 
            {
                accessLevel: req.accessLevel,
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