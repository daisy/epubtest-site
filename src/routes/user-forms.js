var express = require('express')
const db = require('../database');
const Q = require('../queries');
const { validator, validationResult, body } = require('express-validator');
var router = express.Router()

// submit set password
router.post('/set-password', 
    [
        body('password').isLength({ min: 8, max: 20 })
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            let message = "Password must be 8-20 characters";
            return res.status(422).redirect('/set-password?message=' + encodeURIComponent(message));
        }

        let dbres = await db.query(
            Q.AUTH.SET_PASSWORD, 
            {
                input: {
                    userId: req.userId, 
                    newPassword: req.body.password
                }
            }
            , req.cookies.jwt);
        if (!dbres.success) {
            let message = "Error setting password";
            return res
                .status(401)
                .redirect('/set-password?message=' + encodeURIComponent(message));
        }
        let message = "Success. Login with your new password."
        return res
                .status(200)
                // clear the temporary cookie
                .clearCookie('jwt', {
                    path: '/'
                })
                .redirect('/login?message=' + encodeURIComponent(message));
                
    }
);

// submit request to publish
router.post('/request-to-publish', async (req, res, next) => {
    let dbres = await db.query(
        Q.REQUESTS.ADD, 
        { answerSetId: parseInt(req.body.answerSetId) }, 
        req.cookies.jwt);
    
    if (!dbres.success) {
        let err = new Error("Could not create request to publish");
        return next(err);
    }

    res.redirect('/user/dashboard');
});

// submit results
router.post('/results', 
    [
        body('answerSetId').isNumeric(),
        body('summary').trim(),
        body('answers.*.notes').trim()
    ],
    async (req, res, next) => {
        let summary = req.body.summary;
        let answers = req.body.answers;
        if (answers && answers.length > 0) {
            let passed = answers.filter(a=>a.value === 'PASS');
            let score = passed.length / answers.length * 100;
            let data = {
                answerSetId: parseInt(req.body.answerSetId),
                summary,
                answerIds: answers.map(a=>parseInt(a.id)),
                answerValues: answers.map(a=>a.value),
                notes: answers.map(a=>a.notes),
                notesArePublic: answers.map(a=>a.publishNotes === 'on'),
                score: String(score)
            }
        
            let dbres = await db.query(Q.ANSWER_SETS.UPDATE_ANSWERSET_AND_ANSWERS, {input: data}, req.cookies.jwt);
            
            if (!dbres.success) {
                let err = new Error(`Could not update answer set ${req.body.answerSetId}`);
                return next(err);
            }
        }
        return res.redirect('/user/dashboard');
    }
);

// submit profile
router.post('/profile', 
    async (req, res) => {
        let data = {
            name: req.body.name,
            organization: req.body.organization,
            website: req.body.website.indexOf("http://") === -1 ? 
                `http://${req.body.website}` : req.body.website
        };
        let dbres = await db.query(Q.USERS.UPDATE, {id: req.userId, data}, req.cookies.jwt);
        
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
                Q.AUTH.SET_PASSWORD,
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
module.exports = router;