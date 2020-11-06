const path = require('path');
const express = require('express')
const router = express.Router()
const db = require('../database');
const Q = require('../queries');
const utils = require('../utils');

router.get('/test', (req, res) => res.render('test.html'));

// home page
router.get('/', (req, res) => {
    return res.render('index.html');
});

// about page
router.get('/about', (req, res) => res.render('about.html'));

// participate page
router.get('/participate', (req, res) => res.render('participate.html'));

// instructions page
router.get('/instructions', (req, res) => 
    res.redirect('https://dl.daisy.org/Notes_on_Testing_EPUB_reading_systems.docx'));

// server error
router.get('/error', (req, res) => res.render('error.html'));

// forgot password page
router.get('/forgot-password', (req, res) => res.render('auth/forgot-password.html'));

// check your email (for a reset password link) page
//router.get('/check-your-email', (req, res) => res.render('auth/check-your-email.html'));

// testing environment results
router.get('/results/:testingEnvironmentId', async (req, res, next) => {
    let dbres = await db.query(
        Q.TESTING_ENVIRONMENTS_WITH_ANSWERS.GET_PUBLISHED, 
        { id: parseInt(req.params.testingEnvironmentId) }); 
    if (!dbres.success) {
        let err = new Error(`Could not get testing environment (${req.params.testingEnvironmentId})`);
        return next(err);
    }

    return res.render('testing-environment.html', {
        testingEnvironment: dbres.data.testingEnvironment,
        getTopicName: utils.getTopicName
    });
});

// results grid
router.get('/results', async (req, res, next) => {
    let dbres = await db.query(Q.TOPICS.GET_ALL);
    if (!dbres.success) {
        let err = new Error("Could not get topics.");
        return next(err);
    }
    let topics = dbres.data.topics;
    
    dbres = await db.query(Q.TESTING_ENVIRONMENTS.GET_ALL_PUBLISHED);
    if (!dbres.success) {
        let err = new Error("Could not get published testing environments");
        return next(err);
    }
    let testingEnvironments = dbres.data.testingEnvironments;
    
    return res.render('results.html', {
        testingEnvironments,
        topics,
        isArchivesPage: false,
    });
});

router.get('/archive', async (req, res, next) => {
    let dbres = await db.query(Q.TOPICS.GET_ALL);
    if (!dbres.success) {
        let err = new Error("Could not get topics.");
        return next(err);
    }
    let topics = dbres.data.topics;
    
    dbres = await db.query(Q.TESTING_ENVIRONMENTS.GET_ALL_ARCHIVED);
    if (!dbres.success) {
        let err = new Error("Could not get archived testing environments");
        return next(err);
    }
    let testingEnvironments = dbres.data.getArchivedTestingEnvironments;
    
    return res.render('results.html', {
        testingEnvironments,
        topics,
        isArchivesPage: true
    });
});


// test books page
router.get('/test-books', async (req, res, next) => {
    let dbres = await db.query(Q.TEST_BOOKS.GET_LATEST);
    
    if (!dbres.success) {
        let err = new Error("Could not get test books.");
        return next(err);
    }

    return res.render('test-books.html', 
        {
            testBooks: dbres.data.getLatestTestBooks,
            getTopicName: utils.getTopicName
        }
    );
});

// login page
router.get('/login', (req, res) => res.render('auth/login.html', {
    next: req.query.hasOwnProperty('next') ? req.query.next : ''
}));


// reset password page
router.get('/set-password', (req, res) => {
    // verify token
    let jwt = req.query.token;
    let token = utils.parseToken(jwt);
    if (token) {
        return res
                .status(200)
                //.cookie('jwt', jwt, { httpOnly: true/*, secure: true */ , maxAge: token.expires})
                .render('auth/set-password.html', {token: jwt});
    }
    else {
        let message = "Please try again";
        return res
                .status(401)
                .redirect('/forgot-password?message=' + encodeURIComponent(message));
    }
});

// invitation accept page
router.get('/accept-invitation', async (req, res) => {
    // verify token
    let jwt = req.query.token;
    let token = utils.parseToken(jwt);
    if (token) {
        // ensure that this user has an invitation
        let dbres = await db.query(
            Q.INVITATIONS.GET_FOR_USER,
            {userId: token.userId},
            jwt
        );
        
        if (!dbres.success || dbres.data.invitations.length == 0) {
            // could not get invitation
            let message = "Could not retrieve invitation.";
            return res
                    .status(401)
                    .redirect(`error?message=${encodeURIComponent(message)}`);
        }

        // there should just be one invitation per user but just in case there are more
        for (invitation of dbres.data.invitations) {
            // delete the invitation
            dbres = await db.query(
                Q.INVITATIONS.DELETE,
                {
                    id: invitation.id
                }, 
                jwt
            );
        }
        
        return res
                .status(200)
                //.cookie('jwt', jwt, { httpOnly: true/*, secure: true */ , maxAge: token.expires})
                .render(`auth/set-password.html`,
                    {
                        pageTitle: "Welcome",
                        pageMessage: `Thank you for participating in EPUB Accessibility Testing! 
                        Because you'll login to contribute to this site, please set a password. 
                        Then after you've logged in, don't forget to update your profile.`,
                        token: jwt
                    });
    }
    else {
        let message = "Could not verify invitation."
        return res
                .status(401)
                .redirect(`/error?message=${message}`);
    }
});

module.exports = router;