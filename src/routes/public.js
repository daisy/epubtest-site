import express from 'express';
import * as db from '../database/index.js';
import * as Q from '../queries/index.js';
import * as displayUtils from '../displayUtils.js';
import * as utils from '../utils.js';

const router = express.Router()


router.get('/test', (req, res) => res.render('test.njk'));

// home page
router.get('/', (req, res) => {
    return res.render('index.njk');
});

// about page
router.get('/about', (req, res) => res.render('about.njk'));

// participate page
router.get('/participate', (req, res) => res.render('participate.njk'));

// instructions page
router.get('/instructions', (req, res) => 
    res.redirect('https://dl.daisy.org/Notes_on_Testing_EPUB_reading_systems.docx'));

// old URL
router.get('/accessibility', (req, res) => res.redirect('/'));

// server error
router.get('/error', (req, res) => res.render('error.njk'));

// forgot password page
router.get('/forgot-password', (req, res) => res.render('auth/forgot-password.njk'));

// testing environment results
router.get('/results/:testingEnvironmentId', async (req, res, next) => {
    let dbres = await db.query(
        Q.TESTING_ENVIRONMENTS_WITH_ANSWERS.GET_PUBLISHED(), 
        { id: parseInt(req.params.testingEnvironmentId) }); 
    if (!dbres.success) {
        let err = new Error(`Could not get testing environment (${req.params.testingEnvironmentId})`);
        return next(err);
    }

    return res.render('testing-environment.njk', {
        testingEnvironment: dbres.data.testingEnvironment,
        displayUtils
    });
});

// results grid
router.get('/results', async (req, res, next) => {
    let dbres = await db.query(Q.TOPICS.GET_ALL());
    if (!dbres.success) {
        let err = new Error("Could not get topics.");
        return next(err);
    }
    let topics = dbres.data.topics;
    
    dbres = await db.query(Q.TESTING_ENVIRONMENTS.GET_ALL_PUBLISHED());
    if (!dbres.success) {
        let err = new Error("Could not get published testing environments");
        return next(err);
    }
    let testingEnvironments = dbres.data.testingEnvironments;
    
    return res.render('results.njk', {
        testingEnvironments: testingEnvironments.sort(utils.sortAlphaTestEnv),
        topics,
        isArchivesPage: false,
        displayUtils
    });
});

router.get('/archive', async (req, res, next) => {
    let dbres = await db.query(Q.TOPICS.GET_ALL());
    if (!dbres.success) {
        let err = new Error("Could not get topics.");
        return next(err);
    }
    let topics = dbres.data.topics;
    
    dbres = await db.query(Q.TESTING_ENVIRONMENTS.GET_ALL_ARCHIVED());
    if (!dbres.success) {
        let err = new Error("Could not get archived testing environments");
        return next(err);
    }
    let testingEnvironments = dbres.data.getArchivedTestingEnvironments;
    
    return res.render('results.njk', {
        testingEnvironments,
        topics,
        isArchivesPage: true,
        displayUtils
    });
});


// test books page
router.get('/test-books', async (req, res, next) => {
    let dbres = await db.query(Q.TEST_BOOKS.GET_LATEST());
    
    if (!dbres.success) {
        let err = new Error("Could not get test books.");
        return next(err);
    }

    return res.render('test-books.njk', 
        {
            testBooks: dbres.data.getLatestTestBooks,
            displayUtils
        }
    );
});

// login page
router.get('/login', (req, res) => res.render('auth/login.njk', {
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
                .render('auth/set-password.njk', {token: jwt});
    }
    else {
        let message = "Please try again";
        return res
                .status(401)
                .redirect(`/forgot-password?message=${encodeURIComponent(message)}`);
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
            Q.INVITATIONS.GET_FOR_USER(),
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
        
        return res
                .status(200)
                //.cookie('jwt', jwt, { httpOnly: true/*, secure: true */ , maxAge: token.expires})
                .render(`auth/set-password.njk`,
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

router.get('/policy', async (req, res) => {
   return res.render(`policy.njk`);
});

export { router };