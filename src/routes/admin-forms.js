const express = require('express');
const db = require('../database');
const Q = require('../queries');
const router = express.Router()
const invite = require('../invite');
const EPUB = require('../epub-parser/epub');
const formidable = require('formidable')
const utils = require('../utils');

// submit approve request to publish
router.post('/handle-request', async (req, res) => {
    try {
        if (req.body.hasOwnProperty("approve")) {
            await db.queries([
                Q.ANSWER_SETS.PUBLISH, 
                Q.REQUESTS.DELETE
            ], 
            [
                { answerSetId: parseInt(req.body.answerSetId) },
                { requestId: parseInt(req.body.requestId) }
            ], 
            req.cookies.jwt);
        }
        else if (req.body.hasOwnProperty("deny")) {
            await db.query(
                Q.REQUESTS.DELETE, 
                { requestId: parseInt(req.body.requestId) }, 
                req.cookies.jwt);
        }
        return res.redirect('/admin/requests');
    }
    catch (err) {
        console.log(err);
        return res.redirect('/server-error');
    }
});

router.post('/publish', async (req, res) => {

    await db.query(
        Q.ANSWER_SETS.PUBLISH,
        { answerSetId: parseInt(req.body.answerSetId) },
        req.cookies.jwt);
    
    // also clear any requests for publishing that this answer set might have had
    let requests = await db.query(
        Q.REQUESTS.GET_FOR_ANSWERSETS, 
        { ids: [parseInt(req.body.answerSetId)]},
        req.cookies.jwt
    );

    if (requests && requests.data.data.requests.nodes.length > 0) {
        await db.query(
            Q.REQUESTS.DELETE, 
            { requestId: requests.data.data.requests.nodes[0].id }, 
            req.cookies.jwt);
    }

    return res.redirect(`/admin/testing-environment/${req.body.testingEnvironmentId}`);
});

router.post('/unpublish', async (req, res) => {
    await db.query(
        Q.ANSWER_SETS.UNPUBLISH,
        { answerSetId: parseInt(req.body.answerSetId) },
        req.cookies.jwt);
    
    return res.redirect(`/admin/testing-environment/${req.body.testingEnvironmentId}`);
});

router.post('/archive', async (req, res) => {
    await db.query(
        Q.TESTING_ENVIRONMENTS.ARCHIVE,
        { id: parseInt(req.body.testingEnvironmentId) },
        req.cookies.jwt);
    
    return res.redirect(`/admin/testing-environment/${req.body.testingEnvironmentId}`);
});

router.post ('/unarchive', async (req, res) => {
    await db.query(
        Q.TESTING_ENVIRONMENTS.UNARCHIVE,
        { id: parseInt(req.body.testingEnvironmentId) },
        req.cookies.jwt);
    
    return res.redirect(`/admin/testing-environment/${req.body.testingEnvironmentId}`);
});

router.post('/reinvite-users', async (req, res) => {
    try {
        let i;
        for (i = 0; i<req.body.users.length; i++) {
            await invite.inviteUser(req.body.users[i], req.cookies.jwt);
        }

        return res.redirect('/admin/users');
    }
    catch(err) {
        console.log(err);
        return res.redirect('/server-error');
    }
});

router.post("/upload-test-book", async (req, res) => {
    try {
        new formidable.IncomingForm().parse(req, async (err, fields, files) => {
            if (err) {
                console.log(err);
                return res.redirect('/server-error');
            }
            if (files.epub.path == '') {
                console.log(err);
                return res.redirect('/request-error');
            }
            let epub = new EPUB(files.epub.path);
            let epubx = await epub.extract();
            let bookdata = await epubx.parse();
            let testBook = {
                title: bookdata.metadata['dc:title'],
                topicId: bookdata.metadata['dc:subject'],
                description: bookdata.metadata['dc:description'],
                langId: bookdata.metadata['dc:language'],
                epubId: bookdata.metadata['dc:identifier'],
                version: bookdata.metadata['schema:version'],
                filename: files.epub.name,
                path: files.epub.path,
                tests: bookdata.navDoc.testsData.map((t, idx)=>({
                    testId: t.id,
                    xhtml: t.xhtml,
                    order: idx,
                    flag: false,
                    name: t.name,
                    description: t.description
                })),
            }
            
            // TODO compare versions
            /*
            let result = await db.query(Q.TEST_BOOKS.GET_LATEST, {});
            let currentLatestForTopic = result.data.data.getLatestTestBooks.nodes
                .find(book => book.topicId === bookdata.metadata['dc:subject']);
            let testsInCurrent = await db.query(Q.TESTS.GET_FOR_BOOK, 
            {testBookId: parseInt(currentLatestForTopic.id)});
            testsInCurrent = testsInCurrent.data.data.tests;
        
            */
            // if MAJ + MIN are the same, do not suggest any flags
            // if MIN is different, suggest some as flagged
            // if MAJ is different, suggest all as flagged

            // show page where admin can set own flags
            return res.render('./admin/add-test-book.html', 
            {
                accessLevel: req.accessLevel,
                testBook,
                getTopicName: utils.getTopicName
            });
          });
    }
    catch(err) {
        console.log(err);
        return res.redirect('/server-error');
    }
});

router.post("/add-test-book", async (req, res) => {
    try {
        let testBook = JSON.parse(req.body.testBook);
        req.body.tests.map(test => {
            let testInBook = testBook.tests.find(t=>t.testId == test.testId);
            testInBook.flag = test.flag === 'on';
        });
        
        let addBookResult = await db.query(Q.TEST_BOOKS.ADD, {
            topicId: testBook.topicId,
            langId: testBook.langId,
            version: testBook.version,
            title: testBook.title,
            description: testBook.description,
            filename: testBook.filename,
            epubId: testBook.epubId
        }, req.cookies.jwt);

        if (addBookResult.data.hasOwnProperty('errors')) {
            console.log("ERRORS importing book: ", addBookResult.data.errors.map(e=>e.message).join(', '));
            return res.redirect('/server-error');
        }

        
        // let getBookResult = await db.query(Q.GET_TEST_BOOK_ID_BY_EPUBID, {
        //     epubId: testBook.epubId
        // });

        let i;
        for (i=0; i<testBook.tests.length; i++) {
            let test = testBook.tests[i];
            let addTestResult = await db.query(Q.TESTS.ADD, {
                testId: test.testId,
                testBookId: parseInt(addBookResult.id),
                name: test.name,
                description: test.description,
                xhtml: test.xhtml,
                order: i,
                flag: test.flag
            }, req.cookies.jwt);
            if (addTestResult.data.hasOwnProperty('errors')) {
                console.log("ERRORS importing book: ", addTestResult.data.errors.map(e=>e.message).join(', '));
            }
        }

        // TODO add tests not working
        // TODO copy EPUB file to downloads dir
        // TODO plan for upgrade of results

    }
    catch(err) {
        console.log(err);
        return res.redirect('/server-error');
    }
});

router.post("/confirm-delete-test-book/:id", async (req, res) => {
    try {
        let results = await db.query(
            Q.TEST_BOOKS.GET_BY_ID, 
            { id: parseInt(req.params.id) }, 
            req.cookies.jwt);
        let testBook = results.data.data.testBook;

        // TODO: check if there are any answersets which use this book
        

        // if they have answers filled in (e.g. not  NOANSWER), don't allow deletion
        

        // else delete the answers, answersets, and also the testbook

        return res.render('./confirm.html', {
            accessLevel: req.accessLevel,
            title: "Confirm deletion",
            content: `Please confirm that you would like to delete ${testBook.title} (${testBook.langId}, v. ${testBook.version})`,
            redirectUrlYes: '/admin/test-books',
            redirectUrlNo: `/admin/test-books`,
            actionUrl: `/admin/forms/delete-test-book/${parseInt(req.params.id)}`
        });
    }
    catch (err) {
        console.log(err);
        return res.redirect('/server-error');
    }
});

router.post('/delete-test-book/:id', async (req, res) => {
    try {    
        let redirect;

        if (req.body.hasOwnProperty("yes")) {
            // delete test book
            await db.query(Q.TEST_BOOKS.DELETE,
                {id: parseInt(req.params.id)},
                req.cookies.jwt);

            let message = encodeURIComponent("Test book deleted");
            redirect = req.body.redirectUrlYes + "?message=" + message;
        }
        else {
            // else cancel was pressed: do nothing
            redirect = req.body.redirectUrlNo;
        }

        // redirect
        return res.redirect(redirect);
    }
    catch (err) {
        console.log(err);
        return res.redirect('/server-error');
    }
});

router.post('/add-software', async (req, res) => {
    try {
        let name = req.body.name;
        let version = req.body.version;
        let vendor = req.body.vendor;
        let type=req.body.type;

        let response = await(db.query(Q.SOFTWARE.ADD, {
            newSoftwareInput: {
                software: {
                    name,
                    version,
                    vendor,
                    type
                }
            }
            
        }, req.cookies.jwt));

        return res.redirect('/admin/add-testing-environment');
    }
    catch (err) {
        console.log(err);
        return res.redirect('/server-error');
    }
});

router.post('/add-testing-environment', async(req, res) => {

    try {
        let input = {
            readingSystemId: parseInt(req.body.readingSystemId),
            osId: parseInt(req.body.operatingSystemId),
            testedWithBraille: req.body.testedWithBraille === "on",
            testedWithScreenreader: req.body.testedWithScreenreader === "on",
            input: req.body.input
        };
        if (req.body.browserId != 'none') {
            input = {...input, browserId: parseInt(req.body.browserId)};
        }
        if (req.body.assistiveTechnologyId != 'none') {
            input = {...input, assistiveTechnologyId: parseInt(req.body.assistiveTechnologyId)};
        }
        let response = await db.query(Q.TESTING_ENVIRONMENTS.ADD, {
            newTestingEnvironmentInput: {
                testingEnvironment: input
            }
        }, req.cookies.jwt);

        let testingEnvironmentId = response.data.data.createTestingEnvironment.testingEnvironment.id;

        let topics = await db.query(Q.TOPICS.GET_ALL, {});
        topics = topics.data.data.topics.nodes;

        let testBooks = await db.query(Q.TEST_BOOKS.GET_LATEST, {});
        testBooks = testBooks.data.data.getLatestTestBooks.nodes;

        let i;
        for (i=0; i<topics.length; i++) {
            let topicId = topics[i].id;
            if (req.body.hasOwnProperty(topicId) && req.body[topicId] === "on") {
                // get latest test book for this topic
                let book = testBooks.find(tb => tb.topicId === topicId);

                // assign it to the logged-in user
                let userId = parseInt(req.body.user);

                response = await db.query(Q.ANSWER_SETS.ADD, {
                    newAnswerSetInput: {
                        answerSet:{
                            testBookId: book.id,
                            userId,
                            isPublic: false,
                            testingEnvironmentId,
                            score: 0
                        }
                    }
                }, req.cookies.jwt);

                let answerSetId = response.data.data.createAnswerSet.answerSet.id;

                let testsInBook = await db.query(Q.TESTS.GET_FOR_BOOK, {
                    testBookId: book.id
                });

                testsInBook = testsInBook.data.data.tests.nodes;

                let j;
                for (j = 0; j<testsInBook.length; j++) {
                        response = await db.query(Q.ANSWERS.ADD, {
                        newAnswerInput: {
                            answer: {
                                testId: parseInt(testsInBook[j].id),
                                answerSetId: parseInt(answerSetId)
                            }
                        }
                    }, req.cookies.jwt);
                }
            }
        }

        let message = `Testing environment created (ID=${testingEnvironmentId})`;
        return res.redirect('/admin?message=' + encodeURIComponent(message));
    }

    catch (err) {
        console.log(err);
        return res.redirect('/server-error');
    }
});

router.post("/confirm-delete-testing-environment/:id", async (req, res) => {
    try {
        let results = await db.query(
            Q.TESTING_ENVIRONMENTS.GET_BY_ID, 
            { id: parseInt(req.params.id) }, 
            req.cookies.jwt);
        let testenv = results.data.data.testingEnvironment;

        let testingEnvironmentTitle = `
        ${testenv.readingSystem.name} ${testenv.readingSystem.version}
        ${testenv.assistiveTechnology ? testenv.assistiveTechnology.name ? `${testenv.assistiveTechnology.name} ${testenv.assistiveTechnology.version}` : '' : ''}
        ${testenv.os.name} ${testenv.os.version}`;

        return res.render('./confirm.html', {
            accessLevel: req.accessLevel,
            title: "Confirm deletion",
            content: `Please confirm that you would like to delete ${testingEnvironmentTitle}`,
            redirectUrlYes: '/admin/testing',
            redirectUrlNo: `/admin/testing-environment/${parseInt(req.params.id)}`,
            actionUrl: `/admin/forms/delete-testing-environment/${parseInt(req.params.id)}`
        });
    }
    catch (err) {
        console.log(err);
        return res.redirect('/server-error');
    }
});

router.post('/delete-testing-environment/:id', async (req, res) => {
    try {    
        let redirect;

        if (req.body.hasOwnProperty("yes")) {
            // get testing environment
            let results = await db.query(
                Q.TESTING_ENVIRONMENTS.GET_BY_ID, 
                { id: parseInt(req.params.id) }, 
                req.cookies.jwt);
            let testenv = results.data.data.testingEnvironment;

            // delete answers and answer sets
            let i, j;
            let answerSets = testenv.answerSetsByTestingEnvironmentId.nodes;
            for (i=0; i<answerSets.length; i++) {
                let answers = answerSets[i].answersByAnswerSetId.nodes;
                for (j=0; j<answers.length; j++) {
                    await db.query(Q.ANSWERS.DELETE, 
                        {id: answers[j].id}, 
                        req.cookies.jwt);
                }
                await db.query(Q.ANSWER_SETS.DELETE, 
                    {id: answerSets[i].id}, 
                    req.cookies.jwt);
            }
            
            // delete testing environment
            await db.query(Q.TESTING_ENVIRONMENTS.DELETE,
                {id: testenv.id},
                req.cookies.jwt);

            let message = encodeURIComponent("Testing environment deleted");
            redirect = req.body.redirectUrlYes + "?message=" + message;
        }
        else {
            // else cancel was pressed: do nothing
            redirect = req.body.redirectUrlNo;
        }

        // redirect
        return res.redirect(redirect);
    }
    catch (err) {
        console.log(err);
        return res.redirect('/server-error');
    }
});

module.exports = router;