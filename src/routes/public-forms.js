var express = require('express')
const db = require('../database');
const Q = require('../queries');
const utils = require('../utils');
const email = require('../email');
const mail = require('../mail.js');

const { validationResult, body } = require('express-validator');

var router = express.Router()

router.post('/mail', [body('email').isEmail()], async(req, res) => {
    await mail.testEmail(body('email'));
    return res.redirect('/test?error=Message%20sent');
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
            return res.status(422).redirect('/login?error=Login%20error');
        }

        try {
            let result = await db.query(Q.LOGIN(req.body.email, req.body.password));
            let jwt = result.data.data.authenticate.jwtToken;
            let token = utils.parseToken(jwt);
            if (token) {
                res
                    .status(200)
                    .cookie('jwt', jwt, { httpOnly: true/*, secure: true */ , maxAge: token.expires})
                    .redirect('/user/dashboard');
            }
            else {
                res
                    .status(401)
                    .redirect('/login?error=Login%20error');
            }
        }
        catch(err) {
            console.log(err);
            res.redirect('/login?error=Login%20error');
        }

        // db.query(Q.LOGIN(req.body.email, req.body.password))
        // .then(result => {
        //     let jwt = result.data.data.authenticate.jwtToken;
        //     let token = utils.parseToken(jwt);
        //     if (token) {
        //         res
        //             .status(200)
        //             .cookie('jwt', jwt, { httpOnly: true/*, secure: true */ , maxAge: token.expires})
        //             .redirect('/user/dashboard');
        //     }
        //     else {
        //         res
        //             .status(401)
        //             .redirect('/login?error=Login%20error');
        //     }
            
        // })
        // .catch(err => {
        //     console.log(err);
        //     res.redirect('/login?error=Login%20error');
        // });
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
            return res.status(422).redirect('/forgot-password?error=Reset%20password%20error');
        }

        try {
            let result = await db.query(Q.TEMPORARY_TOKEN(req.body.email));
            let jwt = result.data.data.createTemporaryToken.jwtToken;
            let token = utils.parseToken(jwt);
            if (token) {
                email.emailUser(jwt);   
                res
                    .status(200)
                    .redirect('/check-your-email');
            }
        }
        catch(err) {
            console.log(err);
            res.redirect('/forgot-password?error=Reset%20password%20error');
        }
        
        // db.query(Q.TEMPORARY_TOKEN(req.body.email))
        // .then(result => {
        //     let jwt = result.data.data.createTemporaryToken.jwtToken;
        //     let token = utils.parseToken(jwt);
        //     if (token) {
        //         email.emailUser(jwt);   
        //         res
        //             .status(200)
        //             .redirect('/check-your-email');
        //     }
        // })
        // .catch(err => {
        //     console.log(err);
        //     res.redirect('/forgot-password?error=Reset%20password%20error');
        // });
    }
);
module.exports = router;