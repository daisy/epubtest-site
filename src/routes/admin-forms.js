const express = require('express');
const router = express.Router()
const db = require('../database');
const Q = require('../queries');
const invite = require('../actions/invite');
const testBooks = require('../actions/testBooks');
const answerSets = require('../actions/answerSets');
const testingEnvironments = require('../actions/testingEnvironments');
const formidable = require('formidable');
const winston = require('winston');
const utils = require('../utils');
const path = require('path');
const { validator, validationResult, body } = require('express-validator');

// approve or deny request to publish
router.post('/handle-request', async (req, res, next) => {
    if (req.body.hasOwnProperty("approve")) {
        let dbres = await db.query(Q.ANSWER_SETS.UPDATE,
                { 
                    id: parseInt(req.body.answerSetId),
                    patch: {
                      isPublic: true
                    }
                },
                req.cookies.jwt);
        
        if (!dbres.success) {
            let err = new Error("Could not publish answer set.");
            return next(err);
        }
    }
    
    if (req.body.hasOwnProperty("approve") || req.body.hasOwnProperty("deny")) {
        let dbres = await db.query(Q.REQUESTS.DELETE,
            { id: parseInt(req.body.requestId) },
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

    let dbres = await db.query(Q.ANSWER_SETS.UPDATE,
        { 
            id: parseInt(req.body.answerSetId),
            patch: {
              isPublic: true
            }
        },
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

    if (dbres.data && dbres.data.requests.length > 0) {
        dbres = await db.query(Q.REQUESTS.DELETE,
            { id: requests.data.data[0].id },
            req.cookies.jwt);
        
        if (!dbres.success) {
            let err = new Error("Could not delete request to publish.");
            return next(err);
        }
    }

    let nextUrl = req.body.next ?? `/admin/testing-environment/${req.body.testingEnvironmentId}`
    return res.redirect(nextUrl);
});

// unpublish an answer set
router.post('/unpublish', async (req, res, next) => {
    let dbres = await db.query(Q.ANSWER_SETS.UPDATE,
        {
            id: parseInt(req.body.answerSetId),
            patch: {
              isPublic: false
            }
        },
        req.cookies.jwt);
    
    if (!dbres.success) {
        let err = new Error("Could not unpublish answer set.");
        return next(err);
    }

    let nextUrl = req.body.next ?? `/admin/testing-environment/${req.body.testingEnvironmentId}`
    return res.redirect(nextUrl);
});

router.post('/archive', async (req, res, next) => {
    let dbres = await db.query(
        Q.TESTING_ENVIRONMENTS.UPDATE, { 
            id: parseInt(req.body.testingEnvironmentId),
            patch: {isArchived: true}
        },
        req.cookies.jwt);
    
    if (!dbres.success) {
        let err = new Error("Could not archive testing environment.");
        return next(err);
    }

    return res.redirect(`/admin/testing-environment/${req.body.testingEnvironmentId}`);
});

router.post ('/unarchive', async (req, res) => {
    let dbres = await db.query(
        Q.TESTING_ENVIRONMENTS.UPDATE, { 
            id: parseInt(req.body.testingEnvironmentId),
            patch: {isArchived: false} 
        },
        req.cookies.jwt);
    
    if (!dbres.success) {
        let err = new Error("Could not unarchive testing environment.");
        return next(err);
    }
    
    return res.redirect(`/admin/testing-environment/${req.body.testingEnvironmentId}`);
});

router.post('/reinvite-users', async (req, res, next) => {
    // req.body.users is an array of IDs
    for (user of req.body.users) {
        let dbres = await invite.inviteUser(user, req.cookies.jwt);
        if (!dbres.success) {
            let err = new Error(`Could not invite one or more user(s) (ID=${user}).`);
            return next(err);
        }
    }
    return res.redirect('/admin/invite-users');
});

router.post('/manage-invitations/:id', async (req, res, next) => {

    let inviteId = parseInt(req.params.id);
    if (req.body.hasOwnProperty("resend")) {
        let dbres = await invite.resendInvitation(inviteId, req.cookies.jwt);
        if (!dbres.success) {
            let err  = new Error(`Could not resend invitation.`);
            return next(err);
        }
    }
    else if (req.body.hasOwnProperty("cancel")) {
        await invite.cancelInvitation(inviteId, req.cookies.jwt);
    }
    return res.redirect('/admin/invite-users');
});

router.post('/invite-new-user', 
[
    body("name").trim().escape(),
    body("email").trim().isEmail()
],
async (req, res, next) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let message = `Invalid value for ${errors.array().map(err => `${err.param}`).join(', ')}`;
        return res.status(422).redirect('/admin/invite-users?message=' + encodeURIComponent(message));
    }
    
    let message = "";

    // create new inactive login
    let dbres = await db.query(
        Q.LOGINS.CREATE_NEW_LOGIN, 
        {
            email: req.body.email,
            password: '',
            active: false
        },
        req.cookies.jwt
    );

    if (!dbres.success) {
        message = `Could not create invitation: ${dbres.errors.map(err => err.message).join(', ')}`;
        return res.status(422).redirect('/admin/invite-users?message=' + encodeURIComponent(message));
    }
    let loginId = dbres.data.createNewLogin.integer;

    // create new user (will default to type = 'USER')
    dbres = await db.query(
        Q.USERS.CREATE, 
        {
            input: {
                name: req.body.name,
                loginId
            }
        },
        req.cookies.jwt
    );

    if (!dbres.success) {
        message = `Could not create invitation`;
        return res.status(422).redirect('/admin/invite-users?message=' + encodeURIComponent(message));
    }

    let userId = dbres.data.createUser.user.id;

    // send invitation
    dbres = await invite.inviteUser(userId, req.cookies.jwt);
    if (!dbres.success) {
        message = `Could not create invitation`;
        return res.status(422).redirect('/admin/invite-users?message=' + encodeURIComponent(message));
    }

    message = `User ${req.body.email} has been invited.`;
    return res.redirect('/admin/invite-users?message=' + encodeURIComponent(message));
});

router.post("/upload-test-book", async (req, res, next) => {
    new formidable.IncomingForm().parse(req, async (err, fields, files) => {
        if (err) {
            winston.error(err);
            let err = new Error("Upload error");
            return next(err);
        }
        
        let parseResult = await testBooks.parse(files.epub.path, files.epub.name);
        let newTestIds = [];
        if (!parseResult.success) {
            return next(new Error("Could not parse EPUB."));
        }
        let testBook = parseResult.testBook;
        let canAddResult = await testBooks.canAdd(testBook, req.cookies.jwt);
        if (!canAddResult.success) {
            return next(new Error(`Could not add book: ${canAddResult.errors.join('\n\n')}`));
        }

        let setFlagsResult = await testBooks.setFlags(testBook, canAddResult.bookToUpgrade, req.cookies.jwt);
        if (!setFlagsResult.success) {
            return next(new Error(`Error processing book: ${setFlagsResult.errors.join('\n\n')}`));
        }
        let flaggedTestBook = setFlagsResult.testBook;
        let usage = null;
        if (canAddResult.bookToUpgrade) {
            usage = await testBooks.getUsage(canAddResult.bookToUpgrade.id, req.cookies.jwt);
            flaggedTestBook.bookToUpgradeId = canAddResult.bookToUpgrade.id;
        }
        newTestIds = flaggedTestBook.tests.filter(t => t.flagNew).map(t => t.testId);

        // attach these properties
        flaggedTestBook.experimental = req.body.experimental;
        flaggedTestBook.translation = req.body.translation;
        
        // show page where admin can set own flags
        return res.render('./admin/ingest-test-book.html', 
        {
            testBook: flaggedTestBook,
            affectedAnswerSets: usage ? usage?.answerSets?.all : [],
            newTestIds
        });
    });
});

router.post("/ingest-test-book", async (req, res, next) => {
    let testBook = JSON.parse(req.body.testBook);
    let replacesBookId = testBook.bookToUpgradeId;
    testBook.tests.map(test => {
        let testInBook = testBook.tests.find(t=>t.testId == test.testId);
        testInBook.flagChanged = test.flagChanged === "true"; // TODO test this
    });

    let result = await testBooks.add(testBook, req.cookies.jwt);
    
    if (!result.success) {
        let err = new Error(`ERRORS importing book: \n ${result.errors.map(e=>e.message).join(', ')}`);
        return next(err);
    }

    if (replacesBookId != null && replacesBookId != undefined) {
        result = await answerSets.upgrade(result.newBookId, replacesBookId, req.cookies.jwt);
    }
    else {
        result = await answerSets.createAnswerSetsForNewTestBook(result.newBookId, req.cookies.jwt);
    }

    let message = encodeURIComponent(
        `Added test book "${testBook.title}" version ${testBook.version} (topic: ${testBook.topicId}, language: ${testBook.langId})`);
    
    return res.redirect(`/admin/test-books?message=${message}`);

});

router.post("/confirm-delete-test-book/:id", async (req, res, next) => {
    let dbres = await db.query(
        Q.TEST_BOOKS.GET, 
        { id: parseInt(req.params.id) }, 
        req.cookies.jwt);
    if (!dbres.success) {
        let err = new Error(`Error retrieving test book (${req.params.id}).`);
        return next(err);
    }
    let testBook = dbres.data.testBook;

    let canRemove = await testBooks.canRemove(testBook.id, req.cookies.jwt);
    if (!canRemove) {
        let usageResult = await testBooks.getUsage(parseInt(req.params.id), req.cookies.jwt);
        if (usageResult.success) {
            return res.render('./admin/confirm-remove-test-book-and-answer-sets.html', {
                testBook,
                answerSets: usageResult.answerSets.nonEmpty,
                nextIfYes: '/admin/test-books',
                nextIfNo: `/admin/test-books`,
                formAction: `/admin/forms/delete-test-book-and-answer-sets/${parseInt(req.params.id)}`
            });
        }
        else {
            let err = new Error(
                `Could not determine usage for test book ID ${testBook.id} (${testBook.title} v${testBook.version} ${testBook.lang.id})`);
            return next(err);
        }
        
    }
    else {
        return res.render('./confirm.html', {
            title: "Confirm deletion",
            content: `Please confirm that you would like to delete ${testBook.title} (${testBook.langId}, v. ${testBook.version})`,
            nextIfYes: '/admin/test-books',
            nextIfNo: `/admin/test-books`,
            formAction: `/admin/forms/delete-test-book/${parseInt(req.params.id)}`
        });
    }
    
});

router.post('/delete-test-book/:id', async (req, res, next) => {
    let redirect;

    if (req.body.hasOwnProperty("yes")) {
        let result = await testBooks.remove(parseInt(req.params.id), req.cookies.jwt);
        if (!result.success) {
            let errorMessage = 
                `One or more errors encountered; aborting operation. \n\n ${result.errors.join('\n\n')}`;
            return next(new Error(errorMessage));
        }
        
        let message = encodeURIComponent("Test book deleted.");
        redirect = req.body.nextIfYes + "?message=" + message;
    }
    else {
        // else cancel was pressed: do nothing
        redirect = req.body.nextIfNo;
    }

    // redirect
    return res.redirect(redirect);
});

router.post('/delete-test-book-and-answer-sets/:id', async (req, res, next) => {
    let redirect;
    if (req.body.hasOwnProperty("yes")) {
        let dbres = await db.query(
            Q.TEST_BOOKS.DELETE_TEST_BOOK_AND_ANSWER_SETS, 
            {testBookId: parseInt(req.params.id)},
            req.cookies.jwt
        );
        if (!dbres.success) {
            let errorMessage = `One or more errors encountered; aborting operation. \n\n ${result.errors?.join('\n\n')}`;
            return next(new Error(errorMessage));
        }
        
        // TODO remove file from downloads folder

        let message = encodeURIComponent("Test book and answer sets deleted.");
        redirect = req.body.nextIfYes + "?message=" + message;
    }
    else {
        // else cancel was pressed: do nothing
        redirect = req.body.nextIfNo;
    }
    // redirect
    return res.redirect(redirect);
});

router.post('/add-software', async (req, res, next) => {
    let dbres = await(db.query(
        Q.SOFTWARE.CREATE, 
        {
            input: {
                name: req.body.name,
                version: req.body.version,
                vendor: req.body.vendor,
                type: req.body.type
            }
        }, 
        req.cookies.jwt));

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

    // TODO separate form for assigning users
    // this just grabs the req user
    let topicsUsers = [];
    let user = parseInt(req.body.user);
    if (req.body.hasOwnProperty("topics")) {    
        topicsUsers = req.body.topics.map(t=>({topic: t, user}));
    }
    let result = await testingEnvironments.add(input, req.cookies.jwt);

    if (!result.success) {
        let err = new Error("Could not create testing environment.");
        return next(err);
    }
    for (topicUser of topicsUsers) {
        // TODO left off here
        //await testingEnvironments.assign()
    }

    let message = `Testing environment created (${result.testingEnvironmentId}).`;
    return res.redirect('/admin?message=' + encodeURIComponent(message));
});

router.post("/confirm-delete-testing-environment/:id", async (req, res, next) => {
    let dbres = await db.query(
        Q.TESTING_ENVIRONMENTS.GET, 
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
        nextIfYes: `/admin/testing`,
        nextIfNo: `/admin/testing-environment/${req.params.id}`,
        formAction: `/admin/forms/delete-testing-environment/${req.params.id}`
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
            redirect = req.body.nextIfYes + "?message=" + message;
        }
    }
    else {
        // else cancel was pressed: do nothing
        redirect = req.body.nextIfNo;
    }

    // redirect
    return res.redirect(redirect);
});

// update software
router.post("/software", 
[
    body('name').trim(),
    body('vendor').trim(),
    body('version').trim()
],
async (req, res, next) => {
    let url='/admin/software';
    if (req.body.hasOwnProperty("save")) {
        let dbres = await db.query(Q.SOFTWARE.UPDATE, {
            id: parseInt(req.body.id),
            patch: {
                name: req.body.name,
                vendor: req.body.vendor,
                version: req.body.version,
                active: req.body.active === "on"
            }
        }, req.cookies.jwt);
    
        url += '?message=';
        if (!dbres.success) {
            let message = "Error updating software.";
            url = url + encodeURIComponent(message);
        }
        else {
            let message = "Software updated.";
            url = url + encodeURIComponent(message);
        }
    }
    return res.redirect(url);
});

router.post("/confirm-delete-software/:id", async (req, res, next) => {
    let dbres = await db.query(
        Q.SOFTWARE.GET, 
        { id: parseInt(req.params.id) }, 
        req.cookies.jwt);
    
    if (!dbres.success) {
        let err = new Error(`Could not get software (${req.params.id}).`);
        return next(err);
    }
    let software = dbres.data.software;

    let softwareTitle = `${software.vendor} ${software.name} ${software.version}`;

    return res.render('./confirm.html', {
        title: "Confirm deletion",
        content: `Please confirm that you would like to delete ${softwareTitle}`,
        nextIfYes: `/admin/software`,
        nextIfNo: `/admin/software`,
        formAction: `/admin/forms/delete-software/${req.params.id}`
    });
});

router.post('/delete-software/:id', async (req, res, next) => {
    let redirect;

    if (req.body.hasOwnProperty("yes")) {
        let result = await db.query(Q.SOFTWARE.DELETE, {id: parseInt(req.params.id)}, req.cookies.jwt);
        if (!result.success) {
            let err = new Error("Could not delete software.");
            return next(err);
        }
        else {
            let message = encodeURIComponent("Software deleted");
            redirect = req.body.nextIfYes + "?message=" + message;
        }
    }
    else {
        // else cancel was pressed: do nothing
        redirect = req.body.nextIfNo;
    }

    // redirect
    return res.redirect(redirect);
});

router.post('/set-user', async (req, res, next) => {
    let message = '';
    if (req.body.hasOwnProperty('userId') && req.body.hasOwnProperty('answerSetId')) {
        let userId, answerSetId;
        userId = req.body.userId == 'None' ? null : parseInt(req.body.userId);
        answerSetId = req.body.answerSetId ? parseInt(req.body.answerSetId) : null;
         
        let dbres = await db.query(Q.ANSWER_SETS.UPDATE, {
            id: answerSetId,
            patch: {
                userId: userId
            }
        }, req.cookies.jwt);
        if (dbres.success) {
            message = "User successfully assigned.";
        }
        else {
            message = "Could not assign user";
        }
        return res.redirect(`${req.body.next}?message=${encodeURIComponent(message)}`);
    }
    message = "Could not assign user";
    return res.redirect(`${req.body.next}?message=${encodeURIComponent(message)}`);
});

module.exports = router;