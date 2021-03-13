import express from 'express';
const router = express.Router()
import * as db from '../database/index.js';
import * as Q from '../queries/index.js';
import * as utils from '../utils.js';

import * as mail from '../actions/mail.js';
import * as emails from '../emails.js';
import expressValidator from 'express-validator';
const { validator, validationResult, body } = expressValidator;
import * as LANGS from '../l10n/langs.js';


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
            Q.AUTH.LOGIN(), 
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
            Q.AUTH.TEMPORARY_TOKEN(),
            {
                input: {
                    email: req.body.email,
                    duration: '4 hours'
                }
            });
        if (!dbres.success) {
            let message = "Reset password error";
            return res.redirect('/forgot-password?message=' + encodeURIComponent(message));
        }
        let jwt = dbres.data.createTemporaryToken.jwtToken;
        let token = utils.parseToken(jwt);
        if (token) {
            let resetUrl = process.env.NODE_ENV != 'production' ? 
                `http://localhost:${process.env.PORT}/set-password?token=${jwt}`
                : 
                `http://epubtest.org/set-password?token=${jwt}`;
            let success = await mail.sendEmail(req.body.email, 
                emails.reset.subject,
                emails.reset.text(resetUrl),
                emails.reset.html(resetUrl));  
            
            let message = success ? 
                "Password reset initiated. Please check your email for further instructions." 
                : 
                "Could not initiate password reset. Please contact an administrator."; 
            return res.status(200)
                .redirect(`/?message=` + encodeURIComponent(message));
        }
        else {
            let message = "Reset password error";
            return res.redirect('/forgot-password?message=' + encodeURIComponent(message));
        }
    }
);

// submit set password (requires a "token" field in the form body)
router.post('/set-password', 
    [
        body('password').isLength({ min: 8, max: 20 })
    ],
    async (req, res) => {
        let jwt = req.body.token;
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            let message = "Password must be 8-20 characters";
            return res.status(422).redirect(`/set-password?token=${jwt}&message=${encodeURIComponent(message)}`);
        }

        let token = utils.parseToken(jwt);
        let dbres = await db.query(
            Q.USERS.GET(),
            {id: token.userId},
            jwt
        );
        if (!dbres.success) {
            let message = "Could not identify user";
            return res.redirect("/");
        }
        
        dbres = await db.query(
            Q.AUTH.SET_PASSWORD(), 
            {
                input: {
                    userId: token.userId, 
                    newPassword: req.body.password
                }
            }, 
            jwt
        );
        
        if (!dbres.success) {
            let message = "Error setting password";
            return res
                .status(401)
                .redirect(`/set-password?token=${jwt}&message=${encodeURIComponent(message)}`);
        }

        // delete any invitations for this user
        dbres = await db.query(
            Q.INVITATIONS.GET_FOR_USER(),
            {userId: token.userId},
            jwt
        );
        // there should just be one invitation per user but just in case there are more
        for (let invitation of dbres.data.invitations) {
            // delete the invitation
            dbres = await db.query(
                Q.INVITATIONS.DELETE(), 
                {
                    id: invitation.id
                }, 
                jwt
            );
        }
        
        let message = "Success. Login with your new password."
        return res
                .status(200)
                // clear the temporary cookie
                // .clearCookie('jwt', {
                //     path: '/'
                // })
                .redirect('/login?message=' + encodeURIComponent(message));
                
    }
);

    
router.post('/choose-language', [
    body("language").isIn(LANGS)
], (req, res, next) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new Error(`Could not set language to ${req.body.language}`));
    }

    req.i18n.language = req.body.language;
    
    return res.status(200)
            .cookie('currentLanguage', 
                req.body.language, 
                { httpOnly: true/*, secure: true */ })
                .redirect(req.body.next ? req.body.next : '/');
    
});

export { router };