import express from 'express';
import * as db from '../database/index.js';
import * as Q from '../queries/index.js';
import * as utils from '../utils.js';
import * as displayUtils from "../displayUtils.js";
import * as privateAccessTokens from '../actions/privateAccessTokens.js';
import dayjs from 'dayjs';

const router = express.Router()

// attach a property "hasFlaggedAnswers" to the answer sets (as a convenience)
router.get('/dashboard/testing/:testingEnvironmentId', async (req, res, next) => {
    // get the testing environment with the user's answer sets (happens at DB level)
    let dbres = await db.query(Q.TESTING_ENVIRONMENTS_WITH_ANSWERS.GET(), 
        {
            id: parseInt(req.params.testingEnvironmentId)
        }, 
        req.cookies.jwt);
    
    if (!dbres.success || dbres.data.testingEnvironment == null) {
        let err = new Error("Could not get testing environment ID " + req.params.testingEnvironmentId);
        return next(err);
    }
    
    let testingEnvironment = dbres.data.testingEnvironment;
    
    // admins can view everything, so their testing environments will have all the answer sets
    // we need to filter it to only include their assignments
    if (res.locals.accessLevel == 'admin') {
        testingEnvironment.answerSets = testingEnvironment.answerSets.filter(aset => aset.user && aset.user.id == req.userId);
    }
    testingEnvironment?.answerSets?.map(aset => {
        aset.hasFlaggedAnswers = aset.answers.find(a => a.flag) != undefined;
    });
    testingEnvironment?.answerSets?.sort((a, b) => a.testBook.topic.order > b.testBook.topic.order ? 1 : -1);

    let answerSetIds = testingEnvironment.answerSets.map(ans => ans.id);

    dbres = await db.query(Q.REQUESTS.GET_FOR_ANSWERSETS(), {ids: answerSetIds}, req.cookies.jwt);
    
    if (!dbres.success) {
        let err = new Error("Could not get requests.");
        return next(err);
    }

    let requests = dbres.data.requests;

    return res.render('dashboard-details.njk', 
        {
            testingEnvironment,
            getPublishRequest: answerSetId => {
                let retval = requests.find(r => r.answerSet.id === answerSetId);
                return retval;
            },
            displayUtils
        }
    );
});
// user dashboard page
// attach a property "outdated" to answer set and testing environment objects
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
    for (let testingEnvironment of userTestingEnvironments) {
        testingEnvironment.answerSets.sort((a, b) => a.testBook.topic.order > b.testBook.topic.order ? 1 : -1);

        // if the answer set was modified before the test book ingestion, then it is outdated
        testingEnvironment.answerSets.map(aset => {
            aset.outdated = aset.lastModified != '' && dayjs(aset.lastModified).isBefore(dayjs(aset.testBook.ingested));
        });
        testingEnvironment.outdated = testingEnvironment.answerSets.find(aset => aset.outdated) != undefined;
    }

    return res.render('dashboard.njk', 
        {
            testingEnvironments: userTestingEnvironments.sort(utils.sortAlphaTestEnv),
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
// attach a property "hasFlaggedAnswers" to the answer sets (as a convenience)
router.get('/edit-results/:answerSetId', async (req, res, next) => {
    let dbres = await db.query(
        Q.ANSWER_SETS.GET(),
        { id: parseInt(req.params.answerSetId) },
        req.cookies.jwt);
    
    if (!dbres.success || dbres.data.answerSet == null) {
        let err = new Error(`Could not get answer set (${req.params.answerSetId})`);
        return next(err);
    }
    let answerSet = dbres.data.answerSet;
    
    answerSet.hasFlaggedAnswers = answerSet.answers.find(a => a.flag) != undefined;

    let nextUrl = req.query.hasOwnProperty('next') ?
     req.query.next 
     : 
     `/user/dashboard/testing/${answerSet.testingEnvironment.id}#a${answerSet.id}`;

    return res.render('edit-results.njk', {
        answerSet,
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