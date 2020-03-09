var express = require('express');
const db = require('../database');
const Q = require('../queries/queries');
const QADMIN = require('../queries/admin');
const utils = require('../utils');

var router = express.Router()

router.get('/', async(req, res) => {
    return res.render('./admin/index.html', {
        accessLevel: req.accessLevel
    });
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
        // let makeName = rs => `${rs.name}${rs.version != 'undefined' && rs.version != 'null' ? rs.version : ''}`;
        // let alpha = (a,b) => makeName(a.readingSystem) > makeName(b.readingSystem) ? 1 
        //     : makeName(a.readingSystem) === makeName(b.readingSystem) ? 0 : -1;
        let results = await db.queries(
            [QADMIN.REQUESTS, QADMIN.ALL_TESTING_ENVIRONMENTS, Q.PUBLIC_RESULTS, Q.ARCHIVED_RESULTS], 
            [], 
            req.cookies.jwt);
        
        let requests = results[0].data.data.requests.nodes;
        let publicTestingEnvironments = results[2].data.data.getPublishedTestingEnvironments.nodes
            .sort(utils.sortAlphaTestEnv);
        let publicArchivedTestingEnvironments = results[3].data.data.getArchivedTestingEnvironments.nodes
            .sort(utils.sortAlphaTestEnv);
        let unpublishedTestingEnvironments = results[1].data.data.testingEnvironments.nodes
            .filter(tenv => !tenv.isArchived
                && publicTestingEnvironments.find(n=>n.id === tenv.id) == undefined )
            .sort(utils.sortAlphaTestEnv);
        let unpublishedArchivedTestingEnvironments = results[1].data.data.testingEnvironments.nodes
            .filter(tenv => tenv.isArchived 
                && publicArchivedTestingEnvironments.find(n=>n.id === tenv.id) == undefined )
            .sort(utils.sortAlphaTestEnv);
        // too slow
        // TODO write pgsql function
        /*let noResultsTestingEnvironments = results[1].data.data.testingEnvironments.nodes
            .filter(tenv => {
                let answerSets = tenv.answerSetsByTestingEnvironmentId.nodes;
                let completedAnswerSets = answerSets.filter(aset => {
                    let answered = aset.answersByAnswerSetId.nodes
                        .filter(ans => ans.value != 'NOANSWER');
                    return answered.length !== 0;
                });
                return completedAnswerSets.length === 0;
            });*/
        return res.render('./admin/testing.html', 
            {
                accessLevel: req.accessLevel,
                publicTestingEnvironments,
                publicArchivedTestingEnvironments,
                unpublishedTestingEnvironments,
                unpublishedArchivedTestingEnvironments,
                // noResultsTestingEnvironments,
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

router.get("/software", async (req, res) => {
    try {
        let results = await db.queries(
            [QADMIN.READING_SYSTEMS,
            QADMIN.ASSISTIVE_TECHNOLOGIES,
            QADMIN.OPERATING_SYSTEMS,
            QADMIN.BROWSERS],
            [],
            req.cookies.jwt
        );
        
        return res.render('./admin/all-software.html', {
            accessLevel: req.accessLevel,
            readingSystems: results[0].data.data.softwares.nodes.sort(utils.sortAlpha),
            assistiveTechnologies: results[1].data.data.softwares.nodes.sort(utils.sortAlpha),
            operatingSystems: results[2].data.data.softwares.nodes.sort(utils.sortAlpha),
            browsers: results[3].data.data.softwares.nodes.sort(utils.sortAlpha)
        });
    }
    catch (err) {
        console.log(err);
        return res.redirect('/server-error');
    }


    
});

router.get('/add-testing-environment', async (req, res) => {
     try {
        let results = await db.queries(
            [QADMIN.READING_SYSTEMS,
            QADMIN.ASSISTIVE_TECHNOLOGIES,
            QADMIN.OPERATING_SYSTEMS,
            QADMIN.BROWSERS,
            Q.TOPICS],
            [],
            req.cookies.jwt
        );

        return res.render("./admin/add-testing-environment.html", {
            accessLevel: req.accessLevel,
            readingSystems: results[0].data.data.softwares.nodes.sort(utils.sortAlpha),
            assistiveTechnologies: results[1].data.data.softwares.nodes.sort(utils.sortAlpha),
            operatingSystems: results[2].data.data.softwares.nodes.sort(utils.sortAlpha),
            browsers: results[3].data.data.softwares.nodes.sort(utils.sortAlpha),
            getTopicName: utils.getTopicName,
            topics: results[4].data.data.topics.nodes.sort(utils.sortTopicOrder)
        });
    }
    catch (err) {
        console.log(err);
        return res.redirect('/server-error');
    }
});

router.get('/add-reading-system', (req, res) => {
    try {
        return res.render('./admin/add-software.html', {
            title: "Add Reading System",
            type: "READING_SYSTEM"
        });
    }
    catch (err) {
        console.log(err);
        return res.redirect('/server-error');
    }
});

router.get('/add-assistive-technology', (req, res) => {
    try {
        return res.render('./admin/add-software.html', {
            title: "Add Assistive Technology",
            type: "ASSISTIVE_TECHNOLOGY"
        });
    }
    catch (err) {
        console.log(err);
        return res.redirect('/server-error');
    }
});

router.get('/add-operating-system', (req, res) => {
    try {
        return res.render('./admin/add-software.html', {
            title: "Add Operating System",
            type: "OPERATING_SYSTEM"
        });
    }
    catch (err) {
        console.log(err);
        return res.redirect('/server-error');
    }
});

module.exports = router;