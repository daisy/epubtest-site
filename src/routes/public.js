const path = require('path');
const express = require('express')
const router = express.Router()
const db = require('../database');
const Q = require('../queries');
const utils = require('../utils');
const axios = require('axios');

const mail = require('../mail.js');

router.get('/test', async (req, res) => {
    await mail.emailInvitation("xyz");
    return res.redirect('/');
});

// home page
router.get('/', (req, res) => res.render('index.html', { accessLevel: req.accessLevel}));

// server error
router.get('/server-error', (req, res) => res.render('server-error.html', { accessLevel: req.accessLevel}));

// testing environment results
router.get('/results/:testingEnvironmentId', (req, res) => {
    db.query(Q.TESTING_ENVIRONMENT(req.params.testingEnvironmentId))
    .then(results => {
        return res.render('./testing-environment.html', {
            accessLevel: req.accessLevel,
            testingEnvironment: results.data.data.testingEnvironment,
            getTopicName: utils.getTopicName
        });
    })
    .catch(err => {
        console.log(err);
        return res.redirect('/server-error');
    });
});

// results grid
router.get('/results', (req, res) => {
    axios.all([
        axios(db.makeRequest(Q.TOPICS)), 
        axios(db.makeRequest(Q.PUBLIC_RESULTS))
    ])
    .then(results => {
        return res.render('./results.html', {
            accessLevel: req.accessLevel,
            testingEnvironments: results[1].data.data.getPublishedTestingEnvironments.nodes,
            topics: results[0].data.data.topics.nodes,
            getfortopic: (answerSets, topic) => {
                return answerSets.find(a => a.testBook.topic.id === topic.id)
            },
            getTopicName: utils.getTopicName
        });
    })
    .catch(err => {
        console.log(err);
        return res.redirect('/server-error');
    });
});

// about page
router.get('/about', (req, res) => res.render('./about.html', {accessLevel: req.accessLevel}));

// test books page
router.get('/test-books', (req, res) => {
    db.query(Q.TEST_BOOKS)
    .then(result => {
        return res.render('./test-books.html', 
            {
                accessLevel: req.accessLevel,
                testBooks: result.data.data.getLatestTestBooks.nodes
            });
    })
    .catch(err => {
        console.log(err);
        return res.redirect('/server-error');
    });
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
    // if it's a logged-in user, we can skip checking the temp token in the query string
    if (utils.parseToken(req.cookies.jwt)) {
        return res
                .status(200)
                .render('./auth/set-password.html',
                    {
                        accessLevel: req.accessLevel
                    });
    }
    else {
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
    }
});

module.exports = router;