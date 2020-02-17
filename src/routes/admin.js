var express = require('express');
const db = require('../database');
const Q = require('../queries/queries');
const QADMIN = require('../queries/admin');
const utils = require('../utils');

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
        let makeName = rs => `${rs.name}${rs.version != 'undefined' && rs.version != 'null' ? rs.version : ''}`;
        let alpha = (a,b) => makeName(a.readingSystem) > makeName(b.readingSystem) ? 1 
            : makeName(a.readingSystem) === makeName(b.readingSystem) ? 0 : -1;
        let results = await db.queries(
            [QADMIN.REQUESTS, QADMIN.ALL_TESTING_ENVIRONMENTS, Q.PUBLIC_RESULTS, Q.ARCHIVED_RESULTS], 
            [], 
            req.cookies.jwt);
        
        let requests = results[0].data.data.requests.nodes;
        let publicTestingEnvironments = results[2].data.data.getPublishedTestingEnvironments.nodes
            .sort(alpha);
        let publicArchivedTestingEnvironments = results[3].data.data.getArchivedTestingEnvironments.nodes
            .sort(alpha);
        let unpublishedTestingEnvironments = results[1].data.data.testingEnvironments.nodes
            .filter(tenv => !tenv.isArchived
                && publicTestingEnvironments.find(n=>n.id === tenv.id) == undefined )
            .sort(alpha);
        let unpublishedArchivedTestingEnvironments = results[1].data.data.testingEnvironments.nodes
            .filter(tenv => tenv.isArchived 
                && publicArchivedTestingEnvironments.find(n=>n.id === tenv.id) == undefined )
            .sort(alpha);
        return res.render('./admin/testing.html', 
            {
                accessLevel: req.accessLevel,
                publicTestingEnvironments,
                publicArchivedTestingEnvironments,
                unpublishedTestingEnvironments,
                unpublishedArchivedTestingEnvironments,
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

router.get('/testing-environment/:id', async (req, res) => {

    try {
        let id = req.params.id;
        let results = await db.queries(
            [Q.TESTING_ENVIRONMENT, QADMIN.ACTIVE_USERS], 
            [{ id: parseInt(id) }, {}], 
            req.cookies.jwt);
        testenv = results[0].data.data.testingEnvironment;
        users = results[1].data.data.getActiveUsers.nodes;
        let requests = await db.query(
            Q.REQUESTS_FOR_ANSWERSETS, 
            { ids: testenv.answerSetsByTestingEnvironmentId.nodes.map(ans => ans.id)},
            req.cookies.jwt
        );
        requests = requests.data.data.requests.nodes;
        return res.render('./admin/testing-environment.html', 
            {
                accessLevel: req.accessLevel,
                testingEnvironment: testenv,
                users,
                getRequestToPublish: answerSetId => {
                    let retval = requests.find(r => r.answerSetId === answerSetId);
                    return retval;
                }
            });
    }
    catch (err) {
        console.log(err);
        return res.redirect('/server-error');
    }
});

// admin test books
router.get('/test-books', async (req, res) => {
    try {
        let result = await db.query(Q.TEST_BOOKS, {});
        return res.render('./admin/test-books.html', 
            {
                accessLevel: req.accessLevel,
                testBooks: result.data.data.getLatestTestBooks.nodes,
                getTopicName: utils.getTopicName
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
    let alpha2 = (a,b) => a.user.name > b.user.name ? 1 : a.user.name == b.user.name ? 0 : -1;
    try {
        let results = await db.queries([
            QADMIN.INACTIVE_USERS, 
            QADMIN.INVITATIONS,
            QADMIN.ACTIVE_USERS],
            [],
            req.cookies.jwt);
        let invitations = results[1].data.data.invitations.nodes;
        let activeUsers = results[2].data.data.getActiveUsers.nodes;
        // filter out users who've been invited
        let inactiveUsers = results[0].data.data.getInactiveUsers.nodes;
        inactiveUsers = inactiveUsers.filter(u => invitations.find(a => a.user.id === u.id) === undefined);
        
        return res.render('./admin/users.html', 
            {
                accessLevel: req.accessLevel,
                invitations: invitations.sort(alpha2),
                inactiveUsers: inactiveUsers.sort(alpha),
                activeUsers: activeUsers.sort(alpha),
                duplicateName: name => inactiveUsers.filter(u => u.name === name).length > 1
            });
    }
    catch(err) {
        console.log(err);
        return res.redirect('/server-error');
    }
});

module.exports = router;