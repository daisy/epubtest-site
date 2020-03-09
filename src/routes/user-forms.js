var express = require('express')
const db = require('../database');
const Q = require('../queries/queries');
const QAUTH = require('../queries/auth');
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

        try {
            let result = await db.query(
                QAUTH.SET_PASSWORD, 
                {
                    input: {
                        userId: req.userId, 
                        newPassword: req.body.password
                    }
                }
                , req.cookies.jwt);
            if (result.data.data.setPassword) {
                let message = "Success. Login with your new password."
                return res
                        .status(200)
                        // clear the temporary cookie
                        .clearCookie('jwt', {
                            path: '/'
                        })
                        .redirect('/login?message=' + encodeURIComponent(message));
            }
            else {
                let message = "Set password error";
                return res
                        .status(401)
                        .redirect('/set-password?message=' + encodeURIComponent(message));
            }
            
        }
        catch(err) {
            let message = "Error setting password";
            console.log(err);
            return res.redirect('/set-password?message=' + encodeURIComponent(message));
        }
    }
);

// submit request to publish
router.post('/request-to-publish', async (req, res) => {
    try {
        await db.query(
            Q.CREATE_REQUEST, 
            { answerSetId: parseInt(req.body.answerSetId) }, 
            req.cookies.jwt);
        res.redirect('/user/dashboard');
    }
    catch(err) {
        console.log(err);
        return res.redirect('/server-error');
    }
});

// submit results
router.post('/results', 
    [
        body('answerSetId').isNumeric(),
        body('summary').trim(),
        body('answers.*.notes').trim()
    ],
    async (req, res) => {
        let summary = req.body.summary;
        let answers = req.body.answers;
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
        try {
            
            await db.query(Q.UPDATE_ANSWER_SET, {input: data}, req.cookies.jwt);
            return res.redirect('/user/dashboard');
        }
        catch(err) {
            console.log(err);
            return res.redirect('/server-error');
        }
    }
);

// submit profile
router.post('/profile', 
    async (req, res) => {
        try {
            let data = {
                name: req.body.name,
                organization: req.body.organization,
                website: req.body.website.indexOf("http://") === -1 ? 
                    `http://${req.body.website}` : req.body.website
            };
            await db.query(Q.UPDATE_USER_PROFILE, {id: req.userId, data}, req.cookies.jwt);
            
            if (req.body.password != "") {
                if (req.body.password.length < 8) {
                    let message = "Password must be 8-20 characters";
                    return res.status(422).redirect('/user/profile?message=' + encodeURIComponent(message));
                }
                await db.query(
                    QAUTH.SET_PASSWORD,
                    {
                        input: {
                            userId: req.userId, 
                            newPassword: req.body.password
                        }
                    },
                    req.cookies.jwt);
            }
            let message = "Profile updated";
            return res.redirect('/user/profile?message=' + encodeURIComponent(message));
        }
        catch(err) {
            console.log(err);
            let message = "Error updating profile";
            return res.redirect('/user/profile?message=' + encodeURIComponent(message));
        }
    }
);
module.exports = router;