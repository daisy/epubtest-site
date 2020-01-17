var express = require('express');
const db = require('../database');
const Q = require('../queries/queries');
const QADMIN = require('../queries/admin');

var router = express.Router()

router.get('/', async(req, res) => {
    return res.redirect('/admin/requests');
});

// admin requests
router.get('/requests', async (req, res) => {
    try {
        let results = await db.query(QADMIN.REQUESTS, {}, req.cookies.jwt);
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
});

// admin testing
router.get('/testing', async (req, res) => {
    try {
        let results = await db.queries(
            [QADMIN.REQUESTS, QADMIN.ALL_TESTING_ENVIRONMENTS], 
            {}, 
            req.cookies.jwt);
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
});


// admin test books
router.get('/test-books', async (req, res) => {
    try {
        return res.render('./admin/test-books.html', 
            {
                accessLevel: req.accessLevel
            });
    }
    catch(err) {
        console.log(err);
        return res.redirect('/server-error');
    }
});

// admin users
router.get('/users', async (req, res) => {
    let alpha = (a,b) => a.name > b.name ? 1 : a.name == b.name ? 0 : -1;
    try {
        let results = await db.queries([
            QADMIN.INACTIVE_USERS, 
            QADMIN.INVITED_USERS,
            QADMIN.ACTIVE_USERS],
            [],
            req.cookies.jwt);
        return res.render('./admin/users.html', 
            {
                accessLevel: req.accessLevel,
                invitedUsers: results[1].data.data.invitations.nodes.sort(alpha),
                inactiveUsers: results[0].data.data.getInactiveUsers.nodes.sort(alpha),
                activeUsers: results[2].data.data.getActiveUsers.nodes.sort(alpha),
            });
    }
    catch(err) {
        console.log(err);
        return res.redirect('/server-error');
    }
});

module.exports = router;