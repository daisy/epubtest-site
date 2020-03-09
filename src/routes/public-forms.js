var express = require('express')
const db = require('../database');
const QAUTH = require('../queries/auth');
const utils = require('../utils');
const mail = require('../mail.js');
const emails = require('../emails.js');
const { validationResult, body } = require('express-validator');

var router = express.Router()

// test mail sending
router.post('/mail', [body('email').isEmail()], async(req, res) => {
    await mail.testEmail(req.body.email);
    let message = "Message sent";
    return res.redirect('/test?message=' + encodeURIComponent(message));
});

// submit login
router.post('/login', 
    [
        body('email').isEmail(),
        body('password').isLength({ min: 8 })
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            let message = "Login error";
            return res.status(422).redirect('/login?message=' + encodeURIComponent(message));
        }

        try {
            let result = await db.query(
                QAUTH.LOGIN, 
                {   
                    input: {
                        email: req.body.email, 
                        password: req.body.password
                    }
                });
            let jwt = result.data.data.authenticate.jwtToken;
            let token = utils.parseToken(jwt);
            if (token) {
                res
                    .status(200)
                    .cookie('jwt', jwt, { httpOnly: true/*, secure: true */ , maxAge: token.expires})
                    .redirect(req.body.next ? req.body.next : '/user/dashboard');
            }
            else {
                let message = "Login error";
                res
                    .status(401)
                    .redirect('/login?message=' + encodeURIComponent(message));
            }
        }
        catch(err) {
            console.log(err);
            let message = "Login error";
            res.redirect('/login?message=' + encodeURIComponent(message));
        }
    }
);

// submit logout
router.post('/logout', (req, res) => {
    res
        .status(200)
        .clearCookie('jwt', {
            path: '/'
        })
        .redirect('/');
});

// submit forgot password
router.post('/forgot-password', 
    [
        body('email').isEmail()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            let message = 'Reset password error';
            return res.status(422).redirect('/forgot-password?message=' + encodeURIComponent(message));
        }

        try {
            let result = await db.query(
                QAUTH.TEMPORARY_TOKEN,
                {
                    input: {
                        email: req.body.email
                    }
                });
            let jwt = result.data.data.createTemporaryToken.jwtToken;
            let token = utils.parseToken(jwt);
            if (token) {
                let resetUrl = process.env.MODE === 'LOCALDEV' ? 
                    `http://localhost:${process.env.PORT}/set-password?token=${jwt}`
                    : 
                    `http://epubtest.org/set-password?token=${jwt}`;
                await mail.sendEmail(req.body.email, 
                    emails.reset.subject,
                    emails.reset.text(resetUrl),
                    emails.reset.html(resetUrl));   
                res
                    .status(200)
                    .redirect('/check-your-email');
            }
        }
        catch(err) {
            console.log(err);
            let message = "Reset password error";
            res.redirect('/forgot-password?message=' + encodeURIComponent(message));
        }
    }
);
module.exports = router;