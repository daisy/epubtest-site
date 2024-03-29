import express from 'express';
import * as db from '../database/index.js';
import * as Q from '../queries/index.js';
import * as utils from '../utils.js';
import * as displayUtils from "../displayUtils.js";
import * as privateAccessTokens from '../actions/privateAccessTokens.js';

const router = express.Router()

// user dashboard page
router.get('/dashboard', async (req, res, next) => {
    let dbres = await db.query(Q.TESTING_ENVIRONMENTS.GET_ALL_BY_USER(), {userId: req.userId}, req.cookies.jwt);
    
    if (!dbres.success) {
        let err = new Error("Could not get user's testing environments.");
        return next(err);
    }
    let userTestingEnvironments = dbres.data.getUserTestingEnvironments;
    
    // admins can view everything, so their testing environments will have all the answer sets
    // we need to filter it to only include their assignments
    if (res.locals.accessLevel == 'admin') {
        for (let testingEnvironment of userTestingEnvironments) {
            testingEnvironment.answerSets = testingEnvironment.answerSets.filter(aset => aset.user && aset.user.id == req.userId);
        }
    }

    let answerSetIds = userTestingEnvironments.map(tenv => 
        tenv.answerSets.map(ans => ans.id))
        .reduce((acc, curr) => acc.concat(curr), []);
    
    dbres = await db.query(Q.REQUESTS.GET_FOR_ANSWERSETS(), {ids: answerSetIds}, req.cookies.jwt);
    
    if (!dbres.success) {
        let err = new Error("Could not get requests.");
        return next(err);
    }

    let requests = dbres.data.requests;
    return res.render('dashboard.njk', 
        {
            testingEnvironments: userTestingEnvironments.sort(utils.sortAlphaTestEnv),
            getRequestToPublish: answerSetId => {
                let retval = requests.find(r => r.answerSet.id === answerSetId);
                return retval;
            },
            displayUtils
        }
    );
});

// user profile page
router.get('/profile', async (req, res, next) => {
    let dbres = await db.query(Q.USERS.GET(), { id: req.userId }, req.cookies.jwt);
    
    if (!dbres.success) {
        let err = new Error(`Could not get profile for user (${req.userId})`);
        return next(err);
    }

    return res.render('profile.njk', 
        {
            user: dbres.data.user
        }
    );
});

// edit results page
router.get('/edit-results/:answerSetId', async (req, res, next) => {
    let dbres = await db.query(
        Q.ANSWER_SETS.GET(),
        { id: parseInt(req.params.answerSetId) },
        req.cookies.jwt);
    
    if (!dbres.success || dbres.data.answerSet == null) {
        let err = new Error(`Could not get answer set (${req.params.answerSetId})`);
        return next(err);
    }
    let nextUrl = req.query.hasOwnProperty('next') ? req.query.next : '/user/dashboard';
    return res.render('edit-results.njk', {
        answerSet: dbres.data.answerSet,
        next: nextUrl,
        displayUtils
    });
});

router.get('/share-link/:answerSetId', async (req, res, next) => {
    // generate a private token if the answer set is private
    let jwt = req.cookies.jwt;
    let dbres = await db.query(
        Q.ANSWER_SETS.GET(),
        { id: parseInt(req.params.answerSetId) },
        jwt);
    
    if (!dbres.success || dbres.data.answerSet == null) {
        let err = new Error(`Could not get answer set (${req.params.answerSetId})`);
        return next(err);
    }
    
    let answerSet = dbres.data.answerSet;

    if (answerSet.isPublic) {
        return res.render("share-link.njk", {answerSet})
    }
    else {
        let newTokenResult = await privateAccessTokens.add(answerSet.id, jwt);
        if (newTokenResult.success) {
            let accessKey = newTokenResult.privateAccessToken.key;
            return res.render("share-link.njk", {answerSet, accessKey});
        }
        else {
            let err = new Error(`Could not create access token for answer set (${answerSet.id})`);
            return next(err);
        }
    }
});

export { router };