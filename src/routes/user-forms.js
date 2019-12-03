var express = require('express')
const db = require('../database');
const Q = require('../queries');
const axios = require('axios');
const { validator, validationResult, body } = require('express-validator');
var router = express.Router()

// submit set password
router.post('/set-password', 
    [
        body('password').isLength({ min: 8, max: 20 })
    ],
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).redirect('/set-password?error=Password%30must%20be%20at%20least%208-20%20characters%20long.');
        }
        db.query(Q.SET_PASSWORD(req.userId, req.body.password))
        .then(result => {
            if (result.data.data.setPassword) {
                return res
                        .status(200)
                        // clear the temporary cookie
                        .clearCookie('jwt', {
                            path: '/'
                        })
                        .redirect('/login?error=Success.%20Login%20with%20your%20new%20password');
            }
            else {
                return res
                        .status(401)
                        .redirect('/set-password?error=Set%20password%20error');
            }
            
        })
        .catch(err => {
            console.log(err);
            return res.redirect('/set-password?error=Error%20setting%20password');
        });
    }
);

// submit request to publish
router.post('/request-to-publish', (req, res) => {
   db.query(Q.CREATE_REQUEST(req.body.answerSetId), req.cookies.jwt)
   .then(result => {
       res.redirect('/user/dashboard');
   })
   .catch(err => {
        console.log(err);
        return res.redirect('/server-error');
    });
});

// submit results
router.post('/results', 
    [
        body('answerSetId').isNumeric(),
        body('summary').trim().escape(),
        body('answers.*.notes').trim().escape()
    ],
    (req, res) => {
        let answerSetId = req.body.answerSetId;
        let summary = req.body.summary;
        
        let q = Q.UPDATE_ANSWER_SET(answerSetId, summary, req.body.answers);
        db.query(q, req.cookies.jwt)
        .then(result => {
            return res.redirect('/user/dashboard');
        })
        .catch(err => {
            console.log(err);
            return res.redirect('/server-error');
        });
        
    }
);
module.exports = router;