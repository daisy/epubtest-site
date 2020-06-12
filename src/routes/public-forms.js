var express = require('express')
const db = require('../database');
const Q = require('../queries');
const utils = require('../utils');
const mail = require('../actions/mail.js');
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
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            let message = "Login error";
            return res.status(422).redirect('/login?message=' + encodeURIComponent(message));
        }

        let dbres = await db.query(
            Q.AUTH.LOGIN, 
            {   
                input: {
                    email: req.body.email, 
                    password: req.body.password
                }
            });
        if (!dbres.success) {
            let message = "Login error";
            return res.redirect('/login?message=' + encodeURIComponent(message));    
        }
        let jwt = dbres.data.authenticate.jwtToken;
        let token = utils.parseToken(jwt);
        if (token) {
            return res.status(200)
                .cookie('jwt', jwt, { httpOnly: true/*, secure: true */ , maxAge: token.expires})
                .redirect(req.body.next ? req.body.next : '/user/dashboard');
        }
        else {
            let message = "Login error";
            return res.status(401)
                .redirect('/login?message=' + encodeURIComponent(message));
        }
    }
);

// submit logout
router.post('/logout', (req, res) => {
    return res
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

        let dbres = await db.query(
            Q.AUTH.TEMPORARY_TOKEN,
            {
                input: {
                    email: req.body.email
                }
            });
        if (!dbres.success) {
            let message = "Reset password error";
            return res.redirect('/forgot-password?message=' + encodeURIComponent(message));
        }
        let jwt = dbres.data.createTemporaryToken.jwtToken;
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
            let message = "Password reset initiated. Please check your email for further instructions."; 
            return res.status(200)
                .redirect(`/?message=` + encodeURIComponent(message));
        }
    }
);
let LANGS = ['en', 'fr'];
router.post('/choose-language', [
    body("language").isIn(LANGS)
], (req, res, next) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new Error(`Could not set language to ${req.body.language}`));
    }

    return res.status(200)
            .cookie('currentLanguage', 
                req.body.language, 
                { httpOnly: true/*, secure: true */ })
                .redirect(req.body.next ? req.body.next : '/');
    
});
module.exports = router;