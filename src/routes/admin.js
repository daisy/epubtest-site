var express = require('express');
const db = require('../database');
const Q = require('../queries');
const axios = require('axios');

var router = express.Router()

// admin requests
router.get('/requests', async (req, res) => {
    try {
        let results = await db.query(Q.REQUESTS, req.cookies.jwt);
        let requests = results.data.data.requests.nodes;
        return res.render('./admin/requests.html', 
            {
                accessLevel: req.accessLevel,
                requests: requests
            });
    }
    catch(err) {
        console.log(err);
        return res.redirect('/server-error');
    }
    // db.query(Q.REQUESTS, req.cookies.jwt)
    // .then(results => {
    //     let requests = results.data.data.requests.nodes;
    //     return res.render('./admin/requests.html', 
    //         {
    //             accessLevel: req.accessLevel,
    //             requests: requests
    //         });
    // })  
    // .catch(err => {
    //     console.log(err);
    //     return res.redirect('/server-error');
    // });
});

// admin testing
router.get('/testing', async (req, res) => {
    try {
        let results = await db.queries([Q.REQUESTS, Q.ALL_TESTING_ENVIRONMENTS], req.cookies.jwt);
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
    }
    catch(err) {
        console.log(err);
        return res.redirect('/server-error');
    }
    // axios.all([
    //     axios(db.makeRequest(Q.REQUESTS, req.cookies.jwt)), 
    //     axios(db.makeRequest(Q.ALL_TESTING_ENVIRONMENTS, req.cookies.jwt))
    // ])
    // .then(results => {
    //     let requests = results[0].data.data.requests.nodes;
    //     let testenvs = results[1].data.data.testingEnvironments.nodes;
    //     return res.render('./admin/testing.html', 
    //         {
    //             accessLevel: req.accessLevel,
    //             testingEnvironments: testenvs,
    //             getRequestToPublish: answerSetId => {
    //                 let retval = requests.find(r => r.answerSetId === answerSetId);
    //                 return retval;
    //             }
    //         });
    // })  
    // .catch(err => {
    //     console.log(err);
    //     return res.redirect('/server-error');
    // });
});


// admin test books
router.get('/test-books', async (req, res) => {
    try {
        let results = await db.queries([Q.REQUESTS, Q.ALL_TESTING_ENVIRONMENTS], req.cookies.jwt);
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
    }
    catch(err) {
        console.log(err);
        return res.redirect('/server-error');
    }
    // axios.all([
    //     axios(db.makeRequest(Q.REQUESTS, req.cookies.jwt)), 
    //     axios(db.makeRequest(Q.ALL_TESTING_ENVIRONMENTS, req.cookies.jwt))
    // ])
    // .then(results => {
    //     let requests = results[0].data.data.requests.nodes;
    //     let testenvs = results[1].data.data.testingEnvironments.nodes;
    //     return res.render('./admin/testing.html', 
    //         {
    //             accessLevel: req.accessLevel,
    //             testingEnvironments: testenvs,
    //             getRequestToPublish: answerSetId => {
    //                 let retval = requests.find(r => r.answerSetId === answerSetId);
    //                 return retval;
    //             }
    //         });
    // })  
    // .catch(err => {
    //     console.log(err);
    //     return res.redirect('/server-error');
    // });
});

// admin users
router.get('/users', async (req, res) => {
    try {
        let results = await db.queries([
            Q.INACTIVE_USERS, 
            Q.INVITED_USERS,
            Q.ACTIVE_USERS],
            req.cookies.jwt);
        return res.render('./admin/users.html', 
            {
                accessLevel: req.accessLevel,
                invitedUsers: results[1].data.data.invitations.nodes,
                inactiveUsers: results[0].data.data.getInactiveUsers.nodes,
                activeUsers: results[2].data.data.getActiveUsers.nodes,
            });
    }
    catch(err) {
        console.log(err);
        return res.redirect('/server-error');
    }
});

module.exports = router;