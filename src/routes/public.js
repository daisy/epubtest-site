const path = require('path');
const express = require('express')
const router = express.Router()
const db = require('../database');
const Q = require('../queries/queries');
const utils = require('../utils');

router.get('/test', (req, res) => {
    return res.render('test.html', { accessLevel: req.accessLevel });
});

// home page
router.get('/', (req, res) => res.render('index.html', { accessLevel: req.accessLevel}));

// server error
router.get('/server-error', (req, res) => res.render('server-error.html', { accessLevel: req.accessLevel}));

// request error
router.get('/request-error', (req, res) => res.render('request-error.html', { accessLevel: req.accessLevel}));

// testing environment results
router.get('/results/:testingEnvironmentId', async (req, res) => {
    try {
        let results = await db.query(
            Q.TESTING_ENVIRONMENT, 
            { id: parseInt(req.params.testingEnvironmentId) });
        return res.render('./testing-environment.html', {
            accessLevel: req.accessLevel,
            testingEnvironment: results.data.data.testingEnvironment,
            getTopicName: utils.getTopicName
        });
    }
    catch(err) {
        console.log(err);
        return res.redirect('/server-error');
    }
});

// results grid
router.get('/results', async (req, res) => {
    try {
        let results = await db.queries(
            [Q.TOPICS, Q.PUBLIC_RESULTS],
            []);
        return res.render('./results.html', {
            accessLevel: req.accessLevel,
            testingEnvironments: results[1].data.data.getPublishedTestingEnvironments.nodes,
            topics: results[0].data.data.topics.nodes,
            getfortopic: (answerSets, topic) => {
                return answerSets.find(a => a.testBook.topic.id === topic.id)
            },
            getTopicName: utils.getTopicName
        });
    }
    catch(err) {
        console.log(err);
        return res.redirect('/server-error');
    }
});

// about page
router.get('/about', (req, res) => res.render('./about.html', {accessLevel: req.accessLevel}));

// test books page
router.get('/test-books', async (req, res) => {
    try {
        let result = await db.query(Q.TEST_BOOKS, {});
        return res.render('./test-books.html', 
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

// participate page
router.get('/participate', (req, res) => {
    return res.render('./participate.html',
        {
            accessLevel: req.accessLevel
        });
});

// instructions page
router.get('/instructions', (req, res) => {
    return res.redirect('https://dl.daisy.org/Notes_on_Testing_EPUB_reading_systems.docx');
});

// login page
router.get('/login', (req, res) => res.render('./auth/login.html', {accessLevel: req.accessLevel}));

// forgot password page
router.get('/forgot-password', (req, res) => res.render('./auth/forgot-password.html', {accessLevel: req.accessLevel}));

// check your email (for a reset password link) page
router.get('/check-your-email', (req, res) => res.render('./auth/check-your-email.html', {accessLevel: req.accessLevel}));

// reset password page
router.get('/set-password', (req, res) => {
    // verify token
    let jwt = req.query.token;
    let token = utils.parseToken(jwt);
    if (token) {
        return res
                .status(200)
                .cookie('jwt', jwt, { httpOnly: true/*, secure: true */ , maxAge: token.expires})
                .render('./auth/set-password.html',
                    {
                        accessLevel: req.accessLevel
                    });
    }
    else {
        return res
                .status(401)
                .redirect('/forgot-password?error=Please%20try%20again.');
    }
});

// invitation accept page
router.get('/accept-invitation', (req, res) => {
    // verify token
    let jwt = req.query.token;
    let token = utils.parseToken(jwt);
    if (token) {
        return res
                .status(200)
                .cookie('jwt', jwt, { httpOnly: true/*, secure: true */ , maxAge: token.expires})
                .render('./auth/set-password.html',
                    {
                        accessLevel: req.accessLevel,
                        pageTitle: "Welcome",
                        pageMessage: `Thank you for participating in EPUB Accessibility Testing! 
                        Because you'll login to contribute to this site, please set a password. 
                        Then after you've logged in, don't forget to update your profile.`
                    });
        }
        else {
            return res
                    .status(401)
                    .redirect('/request-error');
        }
    }
);


module.exports = router;