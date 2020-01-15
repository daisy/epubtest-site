var express = require('express');
const db = require('../database');
const Q = require('../queries');
var router = express.Router()

// user dashboard page
router.get('/dashboard', async (req, res) => {
    try {
        let answersets = await db.query(Q.USER_ANSWERSETS(req.userId), req.cookies.jwt);
        let ids = answersets.data.data.getUserTestingEnvironments.nodes.map(tenv => 
            tenv.answerSetsByTestingEnvironmentId.nodes.map(ans => ans.id))
            .reduce((acc, curr) => acc.concat(curr), []);
        let requests = await db.query(Q.REQUESTS_FOR_ANSWERSETS(ids), req.cookies.jwt);
        requests = requests.data.data.requests.nodes;
        return res.render('./dashboard.html', 
            {
                accessLevel: req.accessLevel,
                testingEnvironments: answersets.data.data.getUserTestingEnvironments.nodes,
                getRequestToPublish: answerSetId => {
                    let retval = requests.find(r => r.answerSetId === answerSetId);
                    return retval;
                }
            });
    }
    catch(err) {
        console.log(err);
        return res.redirect('/server-error');
    }
    // maybe these should be combined into one query .. when i have time to revisit the sql functions
    // db.query(Q.USER_ANSWERSETS(req.userId), req.cookies.jwt)
    // .then(results => {
    //     let ids = results.data.data.getUserTestingEnvironments.nodes.map(tenv => 
    //         tenv.answerSetsByTestingEnvironmentId.nodes.map(ans => ans.id))
    //         .reduce((acc, curr) => acc.concat(curr), []);
        
    //     db.query(Q.REQUESTS_FOR_ANSWERSETS(ids), req.cookies.jwt)
    //     .then(requestsToPublishResults => {
    //         let requests = requestsToPublishResults.data.data.requests.nodes;
    //         return res.render('./dashboard.html', 
    //             {
    //                 accessLevel: req.accessLevel,
    //                 testingEnvironments: results.data.data.getUserTestingEnvironments.nodes,
    //                 getRequestToPublish: answerSetId => {
    //                     let retval = requests.find(r => r.answerSetId === answerSetId);
    //                     return retval;
    //                 }
    //             });
    //         })  
    // })
    // .catch(err => {
    //     console.log(err);
    //     return res.redirect('/server-error');
    // });
});

// user profile page
router.get('/profile', async (req, res) => {
    try {
        let result = await db.query(Q.USER_PROFILE(req.userId), req.cookies.jwt);
        return res.render('./profile.html', 
            {
                accessLevel: req.accessLevel,
                user: result.data.data.user
            });
    }
    catch(err) {
        console.log(err);
        return res.redirect('/server-error');
    }
    // db.query(Q.USER_PROFILE(req.userId), req.cookies.jwt)
    // .then(result => {
    //     return res.render('./profile.html', 
    //         {
    //             accessLevel: req.accessLevel,
    //             user: result.data.data.user
    //         });
    // })
    // .catch(err => {
    //     console.log(err);
    //     return res.redirect('/server-error');
    // });
});

// edit results page
router.get('/edit-results/:answerSetId', async (req, res) => {
    try {
        let results = await db.query(Q.ANSWER_SET(req.params.answerSetId), req.cookies.jwt);
        return res.render('./edit-results.html', {
            accessLevel: req.accessLevel,
            answerSet: results.data.data.answerSet
        });
    }
    catch(err) {
        console.log(err);
        return res.redirect('/server-error');
    }
    // let q = Q.ANSWER_SET(req.params.answerSetId);
    // db.query(q, req.cookies.jwt)
    // .then(results => {
    //     return res.render('./edit-results.html', {
    //         accessLevel: req.accessLevel,
    //         answerSet: results.data.data.answerSet
    //     })
    // })
    // .catch(err => {
    //     console.log(err);
    //     return res.redirect('/server-error');
    // });
});
module.exports = router;