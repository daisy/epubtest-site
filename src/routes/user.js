var express = require('express');
const db = require('../database');
const Q = require('../queries');
const utils = require('../utils');
var router = express.Router()

// user dashboard page
router.get('/dashboard', async (req, res, next) => {
    let dbres = await db.query(Q.TESTING_ENVIRONMENTS.GET_BY_USER, {userId: req.userId}, req.cookies.jwt);
    
    if (!dbres.success) {
        let err = new Error("Could not get user's testing environments.");
        return next(err);
    }
    let userTestingEnvironments = dbres.data.getUserTestingEnvironments.nodes;

    let answerSetIds = userTestingEnvironments.map(tenv => 
        tenv.answerSetsByTestingEnvironmentId.nodes.map(ans => ans.id))
        .reduce((acc, curr) => acc.concat(curr), []);
    
    dbres = await db.query(Q.REQUESTS.GET_FOR_ANSWERSETS, {ids: answerSetIds}, req.cookies.jwt);
    
    if (!dbres.success) {
        let err = new Error("Could not get requests.");
        return next(err);
    }

    let requests = dbres.data.requests.nodes;
    return res.render('dashboard.html', 
        {
            testingEnvironments: userTestingEnvironments.sort(utils.sortAlphaTestEnv),
            getRequestToPublish: answerSetId => {
                let retval = requests.find(r => r.answerSetId === answerSetId);
                return retval;
            }
        }
    );
});

// user profile page
router.get('/profile', async (req, res, next) => {
    let dbres = await db.query(Q.USERS.GET_BY_ID, { id: req.userId }, req.cookies.jwt);
    
    if (!dbres.success) {
        let err = new Error(`Could not get profile for user (${req.userId})`);
        return next(err);
    }

    return res.render('profile.html', 
        {
            user: dbres.data.user
        }
    );
});

// edit results page
router.get('/edit-results/:answerSetId', async (req, res, next) => {
    let dbres = await db.query(
        Q.ANSWER_SETS.GET_BY_ID,
        { id: parseInt(req.params.answerSetId) },
        req.cookies.jwt);
    
    if (!dbres.success) {
        let err = new Error(`Could not get answer set (${req.params.answerSetId})`);
        return next(err);
    }

    return res.render('edit-results.html', {
        answerSet: dbres.data.answerSet
    });
});
module.exports = router;