import express from 'express';
import * as db from '../database/index.js';
import * as Q from '../queries/index.js';
import * as displayUtils from '../displayUtils.js';
import * as utils from '../utils.js';
import semver from 'semver';

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

// per-test public results
// the test ID is the ID in the markup, e.g. basic-010, not the database ID
router.get('/results/topic/:topicId/:version/:testId', async (req, res, next) => {
    let dbres = await db.query(
        Q.TEST_BOOKS.GET_BY_TOPIC_VERSION(),
        { 
            topicId: req.params.topicId, 
            version: req.params.version 
        });
    
    if (!dbres.success || dbres.data.testBooks.length == 0) {
        let err = new Error(`Could not get test book (${req.params.topicId} ${req.params.version})`);
        return next(err);
    }
    let testBook = dbres.data.testBooks[0];

    dbres = await db.query(
        Q.TESTING_ENVIRONMENTS_WITH_ANSWERS.GET_ALL_BY_TESTBOOKS(), 
        { testBookIds: [testBook.id] }); 
    if (!dbres.success) {
        let err = new Error(`Could not get results for book (${req.params.topicId} ${req.params.version})`);
        return next(err);
    }

    // reduce the answer sets to just one test
    // filter out any testing environments with no answer sets for this topic
    // as well as any answer sets that have only NOANSWER values
    let testingEnvironments = dbres.data.testingEnvironments
        .filter(testenv => testenv.answerSets.length > 0)
        .filter(testenv => testenv.answerSets[0].answers.find(a => 
            a.test.testId == req.params.testId && a.value != 'NOANSWER'))
        .sort(utils.sortAlphaTestEnv); 

    // just include one answer in the answer set
    testingEnvironments.map(tenv => {
            let justOneAnswer = tenv.answerSets[0].answers.filter(ans => ans.test.testId == req.params.testId);
            tenv.answerSets[0].answers = justOneAnswer;
        }
    )
    // the actual test
    let test = testingEnvironments[0]?.answerSets[0]?.answers[0]?.test;

    let numPassing = testingEnvironments.filter(tenv => tenv.answerSets[0].answers[0].value == "PASS").length;

    let crumbs = [
        {
            link: "/results",
            label: "Results"
        },
        {
            link: `/results/topic/${req.params.topicId}`,
            label: displayUtils.topicNames[req.params.topicId]
        },
        {
            link: `/results/topic/${req.params.topicId}/${testBook.version}`,
            label: `v${testBook.version}`
        },
        {
            link: `/results/topic/${req.params.topicId}/${testBook.version}/${req.params.testId}`,
            label: req.params.testId
        }
    ];
    return res.render('results-by-test.njk', {
        testingEnvironments,
        testBook,
        test,
        topicId: req.params.topicId,
        numPassing,
        crumbs,
        testId: req.params.testId
    });
});

// per-topic, per-version public results
router.get('/results/topic/:topicId/:version', async (req, res, next) => {

    // get all the test books for a given topic
    // there may be many versions
    
    let dbres = await db.query(
        Q.TEST_BOOKS.GET_BY_TOPIC_VERSION(),
        { topicId: req.params.topicId, version: req.params.version });
    
    if (!dbres.success || dbres.data.testBooks.length == 0) {
        let err = new Error(`Could not get test book(s) for topic (${req.params.topicId})`);
        return next(err);
    }

    let book = dbres.data.testBooks[0];
    dbres = await db.query(
        Q.TESTING_ENVIRONMENTS_WITH_ANSWERS.GET_ALL_BY_TESTBOOKS(), 
        { testBookIds: [book.id] }); 
    if (!dbres.success) {
        // TODO handle the error
    }

    // filter out any testing environments with no answer sets for this book
    // as well as any answer sets that have only NOANSWER values
    book.testingEnvironments = dbres.data.testingEnvironments
        .filter(testenv => testenv.answerSets.length > 0)
        .filter(testenv => testenv.answerSets[0]?.answers.find(a => a.value != 'NOANSWER') != undefined)
        .sort(utils.sortAlphaTestEnv); 

    let allScores = book.testingEnvironments.map(tenv => parseFloat(tenv.answerSets[0]?.score));
    let sumOfScores = allScores.reduce((acc, curr) => acc + curr,0.00);
    book.avgScore = Math.trunc(sumOfScores / (book.testingEnvironments.length * 100) * 100);
    
    // or sort by 100% on a. windows b. mac c. mobile
    let topTestEnvs = book.testingEnvironments.filter(tenv => tenv.answerSets[0]?.score == 100);
    
    let uniqueOsNames = [...new Set(topTestEnvs.map(tenv => tenv.os.name))];

    book.highestScoringRS = {};
    uniqueOsNames.map(osName => 
        book.highestScoringRS[osName] = [...new Set(
            topTestEnvs.filter(tenv => tenv.os.name == osName)
            .map(tenv => tenv.readingSystem.name))
    ]);
    book.tests.map(t => {
        t.numPassing = book.testingEnvironments.filter(te => te.answerSets[0].answers.find(a => a.test.id == t.id && a.value == 'PASS')).length;
    });

    let crumbs = [
        {
            link: "/results",
            label: "Results"
        },
        {
            link: `/results/topic/${req.params.topicId}`,
            label: displayUtils.topicNames[req.params.topicId]
        },
        {
            link: `/results/topic/${req.params.topicId}/${book.version}`,
            label: `v${book.version}`
        }
    ];

    return res.render('results-by-topic-version.njk', {
        topicId: req.params.topicId,
        testBook: book,
        crumbs
    });
});
// per-topic version list
router.get('/results/topic/:topicId', async (req, res, next) => {

    let dbres = await db.query(
        Q.TEST_BOOKS.GET_FOR_TOPIC(),
        { id: req.params.topicId });
    
    if (!dbres.success || dbres.data.testBooks.length == 0) {
        let err = new Error(`Could not get test book(s) for topic (${req.params.topicId})`);
        return next(err);
    }

    // sort the test books by version
    let testBooks = dbres.data.testBooks
        .sort((a, b) => semver.gt(a.version, b.version) ? -1 : 1);
    
    for (let testBook of testBooks) {
        dbres = await db.query(
            Q.TESTING_ENVIRONMENTS_WITH_ANSWERS.GET_ALL_BY_TESTBOOKS(), 
            { testBookIds: [testBook.id]}); 
        // filter out any testing environments with no answer sets for this book
        // as well as any answer sets that have only NOANSWER values
        testBook.testingEnvironments = dbres.success ? 
            testBook.testingEnvironments = dbres.data.testingEnvironments
                .filter(testenv => testenv.answerSets.length > 0)
                .filter(testenv => testenv.answerSets[0]?.answers.find(a => a.value != 'NOANSWER') != undefined)
            : [];
    }

    let crumbs = [
        {
            link: "/results",
            label: "Results"
        },
        {
            link: `/results/topic/${req.params.topicId}`,
            label: displayUtils.topicNames[req.params.topicId]
        }
    ];

    return res.render('results-by-topic.njk', {
        topicId: req.params.topicId,
        testBooks,
        crumbs
    });
});

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
        isAnswerSetPreview: false
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

// test page
router.get('/test-books/:topicId/:version/:testId', async (req, res, next) => {
    let dbres = await db.query(
        Q.TEST_BOOKS.GET_BY_TOPIC_VERSION(),
        { 
            topicId: req.params.topicId, 
            version: req.params.version 
        });
    
    if (!dbres.success || dbres.data.testBooks.length == 0) {
        let err = new Error(`Could not get test book (${req.params.topicId} ${req.params.version})`);
        return next(err);
    }
    let testBook = dbres.data.testBooks[0];
    let test = testBook.tests.find(t => t.testId == req.params.testId);
    let crumbs = [
        {
            link: "/test-books",
            label: "Test books"
        },
        {
            link: `/test-books/${testBook.topic.id}`,
            label: displayUtils.topicNames[testBook.topic.id] 
        },
        {
            link: `/test-books/${testBook.topic.id}/${testBook.version}`,
            label: `v${testBook.version}`
        },
        {
            link: `/test-books/${testBook.topic.id}/${testBook.version}/${test?.testId ?? ''}`,
            label: test?.testId ?? ''
        }
    ];
    if (!test || test == undefined) {
        let err = new Error("Could not get test " + req.params.testId);
        return next(err);
    }
    return res.render('test.njk', 
        {
            test,
            testBook,
            crumbs
        }
    );
});

// test book page but with versioning
router.get('/test-books/:topicId/:version', async (req, res, next) => {
    let dbres = await db.query(
        Q.TEST_BOOKS.GET_BY_TOPIC_VERSION(),
        { 
            topicId: req.params.topicId, 
            version: req.params.version 
        });
    
    if (!dbres.success || dbres.data.testBooks.length == 0) {
        let err = new Error(`Could not get test book (${req.params.topicId} ${req.params.version})`);
        return next(err);
    }
    let testBook = dbres.data.testBooks[0];

    let crumbs = [
        {
            link: "/test-books",
            label: "Test books"
        },
        {
            link: `/test-books/${req.params.topicId}`,
            label: displayUtils.topicNames[req.params.topicId] 
        },
        {
            link: `/test-books/${req.params.topicId}/${testBook.version}`,
            label: `v${testBook.version}`
        }
    ];
    return res.render('test-book.njk', 
        {
            testBook: testBook,
            topicId: req.params.topicId,
            crumbs
        }
    );
});

// test book page
router.get('/test-books/:topicId', async (req, res, next) => {
    let dbres = await db.query(
        Q.TEST_BOOKS.GET_FOR_TOPIC(),
        { id: req.params.topicId });
    
    if (!dbres.success) {
        let err = new Error(`Could not get test books for ${req.params.topicId}`);
        return next(err);
    }

    let sortedBooks = dbres.data.testBooks.sort((a, b) => semver.gt(a.version, b.version) ? -1 : 1)

    let crumbs = [
        {
            link: "/test-books",
            label: "Test books"
        },
        {
            link: `/test-books/${req.params.topicId}`,
            label: displayUtils.topicNames[req.params.topicId] 
        }
    ];
    return res.render('test-book-versions.njk', 
        {
            testBooks: sortedBooks,
            topicId: req.params.topicId,
            crumbs
        }
    );
});

// test books page
router.get('/test-books', async (req, res, next) => {
    let q = Q.TEST_BOOKS.GET_LATEST();
    let dbres = await db.query(q);
    
    if (!dbres.success) {
        let err = new Error("Could not get test books.");
        return next(err);
    }

    return res.render('test-books.njk', 
        {
            testBooks: dbres.data.testBooks.sort((a, b) => a.topic.order < b.topic.order ? -1 : 1)
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
router.get("/cookie-policy", async (req, res) => {
    return res.render('cookie-policy.njk');
});

router.get('/answers/:answerSetId/:key', async(req, res, next) => {
    let key = req.params.key;
    // check if this key allows access to the answer set
    let dbres = await db.query(
        Q.PRIVATE_ACCESS_TOKENS.GET_FOR_KEY(),
        {
            key
        }
    );
    if (!dbres.success) {
        let err = new Error(`Invalid key (${key})`);
        return next(err);
    }
    
    // a key should be unique to an answer set but because of the query type, it will prob return an array of 1
    let entry = dbres.data.privateAccessTokens.find(t => t.answerSetId == parseInt(req.params.answerSetId));
    
    if (!entry) {
        let err = new Error(`Could not access answer set (${req.params.answerSetId})`);
        return next(err);
    }
    // get the jwt for this privateAccessToken entry
    // this jwt will give read-only database access
    let jwt = entry.token;
    let token = utils.parseToken(jwt);
    if (token) {
        let dbres = await db.query(
            Q.ANSWER_SETS.GET(),
            { id: parseInt(req.params.answerSetId) },
            jwt
        );
        
        if (!dbres.success || dbres.data.answerSet == null) {
            let err = new Error(`Could not get answer set (${req.params.answerSetId})`);
            return next(err);
        }

        let answerSet = dbres.data.answerSet;

        return res.render('testing-environment.njk',
            {
                testingEnvironment: answerSet.testingEnvironment,
                answerSet,
                isAnswerSetPreview: true
            }
        );
    }
    else {
        let message = "Could not verify access."
        let err = new Error(message);
        return next(err);
    }
});


export { router };