var express = require('express')
const db = require('../database');
const Q = require('../queries');
const axios = require('axios');

var router = express.Router()

// submit set password
router.post('/set-password', (req, res) => {
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
});

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
router.post('/results', (req, res) => {
    const answerstr = 'answer-';
    const notesstr = 'notes-';
    const publishnotesstr = 'notespublish-';
    let answerSetId = req.body.answerSetId;
    let summary = req.body.summary;
    
    let answerkeys = Object.keys(req.body).filter(k => k.indexOf(answerstr) != -1);
    let notekeys = Object.keys(req.body).filter(k => k.indexOf(notesstr) != -1);
    let publishnotekeys = Object.keys(req.body).filter(k => k.indexOf(publishnotesstr) != -1);
    
    let notes = {};
    notekeys.map(k => {
        let id = k.substr(notesstr.length, k.length -1);
        notes[id] = req.body[k];
    });
    
    let publishnotes = {};
    publishnotekeys.map(k => {
        let id = k.substr(publishnotesstr.length, k.length -1);
        publishnotes[id] = req.body[k];
    });

    let answers = answerkeys.map(k => {
        let id = k.substr(answerstr.length, k.length -1);
        let obj = {
            "id": id, 
            "value": req.body[k],
            "notes": notes[id],
            "publishNotes": publishnotes[id] === "on"};
        return obj;
    });
    
    let q = Q.UPDATE_ANSWER_SET(answerSetId, summary, answers);
    db.query(q, req.cookies.jwt)
    .then(result => {
        return res.redirect('/user/dashboard');
    })
    .catch(err => {
        console.log(err);
        return res.redirect('/server-error');
    });
    
});
module.exports = router;