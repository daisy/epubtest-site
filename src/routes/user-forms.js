import express from 'express';
import * as db from '../database/index.js';
import * as Q from '../queries/index.js';
import * as utils from '../utils.js';
import * as emails from '../emails.js';
import * as mail from '../actions/mail.js';

import expressValidator from 'express-validator';
const { validator, validationResult, body } = expressValidator;

const router = express.Router()

// submit request to publish
router.post('/request', async (req, res, next) => {
    let dbres = await db.query(
        Q.REQUESTS.CREATE(),  
        { 
            input: {
                answerSetId: parseInt(req.body.answerSetId),
                reqType: req.body.requestType
            }
        }, 
        req.cookies.jwt);
    
    if (!dbres.success) {
        let err = new Error("Could not create request to publish/unpublish");
        return next(err);
    }
    
    dbres = await db.query(
        Q.ANSWER_SETS.GET(),
        {
            id: parseInt(req.body.answerSetId)
        },
        req.cookies.jwt
    );
    if (!dbres.success) {
        let err = new Error("Could not generate email notification");
        return next(err);
    }
    // send email notification of new request to publish
    await mail.sendEmail("epubtest@daisy.org", 
        emails.newRequest.subject, 
        emails.newRequest.text(dbres.data.answerSet), 
        emails.newRequest.html(dbres.data.answerSet));   
    res.redirect(`/user/dashboard/testing/${dbres.data.answerSet.testingEnvironment.id}`);
});
router.post('/cancel-request', async (req, res, next) => {
    let dbres = await db.query(
        Q.REQUESTS.GET_FOR_ANSWERSETS(), 
        { ids: [parseInt(req.body.answerSetId)]},
        req.cookies.jwt
    );

    if (!dbres.success || dbres.data.requests.length < 1) {
        let err = new Error("Could not get requests.");
        return next(err);
    }

    dbres = await db.query(
        Q.REQUESTS.DELETE(),  
        { id: dbres.data.requests[0].id},
        req.cookies.jwt);
    
    if (!dbres.success) {
        let err = new Error("Could not cancel request");
        return next(err);
    }
    res.redirect(`/user/dashboard/testing/${req.body.testEnvId}`);
});

// submit results
router.post('/results', 
    [
        body('answerSetId').isNumeric(),
        body('summary').trim(),
        body('answers.*.notes').trim()
    ],
    async (req, res, next) => {
        const valres = validationResult(req);
        if (!valres.isEmpty()) {
            let message = utils.formatValidationResultErrors(valres.errors);
            return res.status(422).redirect('/user/dashboard?message=' + encodeURIComponent(message));
        }
        let summary = req.body.summary;
        // convert to an array
        let answers = Object.keys(req.body.answers).map(answerkey => req.body.answers[answerkey]); 
        if (answers && answers.length > 0) {
            let passed = answers.filter(a=>a.value === 'PASS');
            let data = {
                answerSetId: parseInt(req.body.answerSetId),
                summary,
                answerIds: answers.map(a=>parseInt(a.id)),
                answerValues: answers.map(a=>a.value),
                notes: answers.map(a=>a.notes),
                notesArePublic: answers.map(a=>a.publishNotes === 'on')
            };
        
            let dbres = await db.query(Q.ANSWER_SETS.UPDATE_ANSWERSET_AND_ANSWERS(), {input: data}, req.cookies.jwt);
            
            if (!dbres.success) {
                let err = new Error(`Could not update answer set ${req.body.answerSetId}`);
                return next(err);
            }
        }
        return res.redirect(req.body.next);
    }
);

// submit profile
router.post('/profile', 
    [
      body("name").trim().escape(),
      body("includeCredit").isIn(['on', undefined]),
      body("creditAs").trim()

    ],
    async (req, res) => {
        const valres = validationResult(req);
        
        if (!valres.isEmpty()) {
            let message = utils.formatValidationResultErrors(valres.errors);
            return res.status(422).redirect('/user/profile?message=' + encodeURIComponent(message));
        }
        let website = "";
        if (req.body.website && req.body.website.length > 0) {
            if (req.body.website.indexOf("http://") === -1 && req.body.website.indexOf("https://") === -1) {
                website = `http://${req.body.website}`;
            }
            else {
                website = req.body.website;
            }
        }
        let data = {
            name: req.body.name,
            organization: req.body.organization,
            website,
            includeCredit: req.body.includeCredit === "on",
            creditAs: req.body.creditAs
        };
        let dbres = await db.query(Q.USERS.UPDATE(),  {id: req.userId, patch: data}, req.cookies.jwt);
        
        if (!dbres.success) {
            let message = "Error updating profile.";
            return res.redirect('/user/profile?message=' + encodeURIComponent(message));
        }
        if (req.body.password != "") {
            if (req.body.password.length < 8) {
                let message = "Password must be 8-20 characters";
                return res.status(422).redirect('/user/profile?message=' + encodeURIComponent(message));
            }
            dbres = await db.query(
                Q.AUTH.SET_PASSWORD(),
                {
                    input: {
                        userId: req.userId, 
                        newPassword: req.body.password
                    }
                },
                req.cookies.jwt);
            if (!dbres.success) {
                let message = "Error updating password.";
                return res.redirect('/user/profile?message=' + encodeURIComponent(message));
            }
        }
        let message = "Profile updated.";
        return res.redirect('/user/profile?message=' + encodeURIComponent(message));
    }
);
export { router };