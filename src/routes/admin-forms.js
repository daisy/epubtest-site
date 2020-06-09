const express = require('express');
const router = express.Router()
const db = require('../database');
const Q = require('../queries');
const invite = require('../actions/invite');
const testBooks = require('../actions/testBooks');
const testingEnvironments = require('../actions/testingEnvironments');
const formidable = require('formidable')
const utils = require('../utils');
const path = require('path');

// approve or deny request to publish
router.post('/handle-request', async (req, res, next) => {
    if (req.body.hasOwnProperty("approve")) {
        let dbres = await db.query(Q.ANSWER_SETS.PUBLISH,
            { answerSetId: parseInt(req.body.answerSetId)},
            req.cookies.jwt);
        
        if (!dbres.success) {
            let err = new Error("Could not publish answer set.");
            return next(err);
        }
    }
    
    if (req.body.hasOwnProperty("approve") || req.body.hasOwnProperty("deny")) {
        let dbres = await db.query(Q.REQUESTS.DELETE,
            { requestId: parseInt(req.body.requestId) },
            req.cookies.jwt);
        
        if (!dbres.success) {
            let err = new Error("Could not delete request to publish.");
            return next(err);
        }    
    }
    return res.redirect('/admin/requests');
});

// publish an answer set
router.post('/publish', async (req, res, next) => {

    let dbres = await db.query(Q.ANSWER_SETS.PUBLISH,
        { answerSetId: parseInt(req.body.answerSetId)},
        req.cookies.jwt);
    
    if (!dbres.success) {
        let err = new Error("Could not publish answer set.");
        return next(err);
    }
    
    // also clear any requests for publishing that this answer set might have had
    dbres = await db.query(
        Q.REQUESTS.GET_FOR_ANSWERSETS, 
        { ids: [parseInt(req.body.answerSetId)]},
        req.cookies.jwt
    );

    if (!dbres.success) {
        let err = new Error("Could not get requests.");
        return next(err);
    }

    if (dbres.data && dbres.data.requests.nodes.length > 0) {
        dbres = await db.query(Q.REQUESTS.DELETE,
            { requestId: requests.data.data.nodes[0].id },
            req.cookies.jwt);
        
        if (!dbres.success) {
            let err = new Error("Could not delete request to publish.");
            return next(err);
        }
    }

    return res.redirect(`/admin/testing-environment/${req.body.testingEnvironmentId}`);
});

// unpublish an answer set
router.post('/unpublish', async (req, res, next) => {
    let dbres = await db.query(
        Q.ANSWER_SETS.UNPUBLISH,
        { answerSetId: parseInt(req.body.answerSetId) },
        req.cookies.jwt);
    
    if (!dbres.success) {
        let err = new Error("Could not unpublish answer set.");
        return next(err);
    }

    return res.redirect(`/admin/testing-environment/${req.body.testingEnvironmentId}`);
});

router.post('/archive', async (req, res, next) => {
    let dbres = await db.query(
        Q.TESTING_ENVIRONMENTS.ARCHIVE,
        { id: parseInt(req.body.testingEnvironmentId) },
        req.cookies.jwt);
    
    if (!dbres.success) {
        let err = new Error("Could not archive testing environment.");
        return next(err);
    }

    return res.redirect(`/admin/testing-environment/${req.body.testingEnvironmentId}`);
});

router.post ('/unarchive', async (req, res) => {
    let dbres = await db.query(
        Q.TESTING_ENVIRONMENTS.UNARCHIVE,
        { id: parseInt(req.body.testingEnvironmentId) },
        req.cookies.jwt);
    
    if (!dbres.success) {
        let err = new Error("Could not unarchive testing environment.");
        return next(err);
    }
    
    return res.redirect(`/admin/testing-environment/${req.body.testingEnvironmentId}`);
});

router.post('/reinvite-users', async (req, res) => {
    let i;
    for (i = 0; i<req.body.users.length; i++) {
        let dbres = await invite.inviteUser(req.body.users[i], req.cookies.jwt);
        if (!dbres.success) {
            let err = new Error(`Could not invite one or more user(s) (${req.body.users[i]}).`);
            return next(err);
        }
    }
    return res.redirect('/admin/users');
});

router.post("/upload-test-book", async (req, res, next) => {
    new formidable.IncomingForm().parse(req, async (err, fields, files) => {
        if (err) {
            console.log(err);
            let err = new Error("Upload error");
            return next(err);
        }
        
        let parsedTestBook = await testBooks.parse(files.epub.path, files.epub.name, req.cookies.jwt);
        let newTestIds = [];
        if (!parsedTestBook) {
            return next(new Error("Could not parse EPUB."));
        }
        let canAdd = await testBooks.canAdd(parsedTestBook, req.cookies.jwt);
        if (!canAdd.success) {
            return next(new Error(`Could not add book: ${canAdd.errors.join('\n\n')}`));
        }

        let testBook = await testBooks.setFlags(parsedTestBook, canAdd.replaces);
        let usage = null;
        if (canAdd.replaces) {
            newTestIds = testBook.tests.filter(t => t.flagNew).map(t => t.testId);
            usage = await testBooks.getUsage(canAdd.replaces.id, req.cookies.jwt);
            testBook.replaces = canAdd.replaces.id;
        }

        // show page where admin can set own flags
        return res.render('./admin/ingest-test-book.html', 
        {
            testBook,
            affectedAnswerSets: usage.answerSets.all,
            newTestIds
        });
    });
});

router.post("/ingest-test-book", async (req, res, next) => {
    let testBook = JSON.parse(req.body.testBook);
    req.body.tests.map(test => {
        let testInBook = testBook.tests.find(t=>t.testId == test.testId);
        testInBook.flagChanged = test.flagChanged === "true"; // TODO test this
    });

    let result = await testBooks.add(testBook, req.cookies.jwt);
    
    if (!result.success) {
        let err = new Error(`ERRORS importing book: \n ${result.errors.map(e=>e.message).join(', ')}`);
        return next(err);
    }

    let message = encodeURIComponent(
        `Added test book "${testBook.title}" version ${testBook.version} (topic: ${testBook.topicId}, language: ${testBook.langId})`);
    
    return res.redirect(`/admin/test-books?message=${message}`);

});

router.post("/confirm-delete-test-book/:id", async (req, res, next) => {
    let dbres = await db.query(
        Q.TEST_BOOKS.GET_BY_ID, 
        { id: parseInt(req.params.id) }, 
        req.cookies.jwt);
    if (!dbres.success) {
        let err = new Error(`Error retrieving test book (${req.params.id}).`);
        return next(err);
    }
    let testBook = dbres.data.testBook;

    let canRemove = await testBooks.canRemove(testBook.id);
    if (!canRemove) {
        let err = new Error("Test book is in use and cannot be removed.");
        err.statusCode = 403;
        return next(err);
    }
        
    return res.render('./confirm.html', {
        title: "Confirm deletion",
        content: `Please confirm that you would like to delete ${testBook.title} (${testBook.langId}, v. ${testBook.version})`,
        redirectUrlYes: '/admin/test-books',
        redirectUrlNo: `/admin/test-books`,
        actionUrl: `/admin/forms/delete-test-book/${parseInt(req.params.id)}`
    });
});

router.post('/delete-test-book/:id', async (req, res, next) => {
    let redirect;

    if (req.body.hasOwnProperty("yes")) {
        let result = await testBooks.remove(req.params.id, req.cookies.jwt);
        if (!result.success) {
            let errorMessage = 
                `One or more errors encountered; aborting operation. \n\n ${result.errors.join('\n\n')}`;
            return next(new Error(errorMessage));
        }
        
        let message = encodeURIComponent("Test book deleted.");
        redirect = req.body.redirectUrlYes + "?message=" + message;
    }
    else {
        // else cancel was pressed: do nothing
        redirect = req.body.redirectUrlNo;
    }

    // redirect
    return res.redirect(redirect);
});

router.post('/add-software', async (req, res, next) => {
    let dbres = await(db.query(Q.SOFTWARE.ADD, {
        newSoftwareInput: {
            software: {
                name: req.body.name,
                version: req.body.version,
                vendor: req.body.vendor,
                type: req.body.type
            }
        }
    }, req.cookies.jwt));

    if (!dbres.success) {
        let err = new Error("Could not add software.");
        return next(err);
    }

    return res.redirect('/admin/add-testing-environment');
});

router.post('/add-testing-environment', async(req, res, next) => {
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

    let topicsUsers = [];
    let user = parseInt(req.body.user);
    if (req.body.hasOwnProperty("topics")) {    
        topicsUsers = req.body.topics.map(t=>({topic: t, user}));
    }
    let result = await testingEnvironments.add(input, topicsUsers, req.cookies.jwt);

    if (!result.success) {
        let err = new Error("Could not create testing environment.");
        return next(err);
    }
    else {
        let message = `Testing environment created (${result.testingEnvironmentId}).`;
        return res.redirect('/admin?message=' + encodeURIComponent(message));
    }
});

router.post("/confirm-delete-testing-environment/:id", async (req, res, next) => {
    let dbres = await db.query(
        Q.TESTING_ENVIRONMENTS.GET_BY_ID, 
        { id: parseInt(req.params.id) }, 
        req.cookies.jwt);
    
    if (!dbres.success) {
        let err = new Error(`Could not get testing environment (${req.params.id}).`);
        return next(err);
    }
    let testenv = dbres.data.testingEnvironment;

    let testingEnvironmentTitle = `
    ${testenv.readingSystem.name} ${testenv.readingSystem.version}
    ${testenv.assistiveTechnology ? testenv.assistiveTechnology.name ? `${testenv.assistiveTechnology.name} ${testenv.assistiveTechnology.version}` : '' : ''}
    ${testenv.os.name} ${testenv.os.version}`;

    return res.render('./confirm.html', {
        title: "Confirm deletion",
        content: `Please confirm that you would like to delete ${testingEnvironmentTitle}`,
        redirectUrlYes: '/admin/testing',
        redirectUrlNo: `/admin/testing-environment/${parseInt(req.params.id)}`,
        actionUrl: `/admin/forms/delete-testing-environment/${parseInt(req.params.id)}`
    });
});

router.post('/delete-testing-environment/:id', async (req, res, next) => {
    let redirect;

    if (req.body.hasOwnProperty("yes")) {
        let result = await testingEnvironments.remove(parseInt(req.params.id), req.cookies.jwt);
        if (!result.success) {
            let err = new Error("Could not remove testing environment.");
            return next(err);
        }
        else {
            let message = encodeURIComponent("Testing environment deleted");
            redirect = req.body.redirectUrlYes + "?message=" + message;
        }
    }
    else {
        // else cancel was pressed: do nothing
        redirect = req.body.redirectUrlNo;
    }

    // redirect
    return res.redirect(redirect);
});

module.exports = router;