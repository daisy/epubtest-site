var express = require('express');
const db = require('../database');
const Q = require('../queries');
const utils = require('../utils');

var router = express.Router()

router.get('/', async(req, res) => res.render('admin/index.html'));

// admin requests
router.get('/requests', async (req, res, next) => {
    let dbres = await db.query(Q.REQUESTS.GET_ALL, {}, req.cookies.jwt);
    
    if (!dbres.success) {
        let err = new Error("Could not get requests.");
        return next(err);
    }
    
    return res.render('./admin/requests.html', 
        { 
            requests: dbres.data.requests 
        }
    );
});

// admin testing
router.get('/testing', async (req, res, next) => {
    let dbres = await db.query(Q.REQUESTS.GET_ALL, {}, req.cookies.jwt);
    if (!dbres.success) {
        let err = new Error("Could not get requests.");
        return next(err);
    }
    let requests = dbres.data.requests;
    dbres = await db.query(Q.TESTING_ENVIRONMENTS.GET_ALL, {}, req.cookies.jwt);
    if (!dbres.success) {
        let err = new Error("Could not get testing environments.");
        return next(err);
    }
    let allTestEnvs = dbres.data.testingEnvironments;

    // the following two are public datasets so no jwt required
    dbres = await db.query(Q.TESTING_ENVIRONMENTS.GET_ALL_PUBLISHED);
    if (!dbres.success) {
        let err = new Error("Could not get published testing environments.");
        return next(err);
    }
   let publishedTestEnvs = dbres.data.testingEnvironments;
    dbres = await db.query(Q.TESTING_ENVIRONMENTS.GET_ALL_ARCHIVED);
    if (!dbres.success) {
        let err = new Error("Could not get archived testing environments.");
        return next(err);
    }
    let archivedTestEnvs = dbres.data.getArchivedTestingEnvironments;

    let publicTestingEnvironments = publishedTestEnvs.sort(utils.sortAlphaTestEnv);
    let publicArchivedTestingEnvironments = archivedTestEnvs.sort(utils.sortAlphaTestEnv);
    let unpublishedTestingEnvironments = allTestEnvs.filter(tenv => !tenv.isArchived
            && publicTestingEnvironments.find(n=>n.id === tenv.id) == undefined )
            .sort(utils.sortAlphaTestEnv);
    let unpublishedArchivedTestingEnvironments = allTestEnvs.filter(tenv => tenv.isArchived 
            && publicArchivedTestingEnvironments.find(n=>n.id === tenv.id) == undefined )
            .sort(utils.sortAlphaTestEnv);
    // too slow
    // TODO write pgsql function
    /*let noResultsTestingEnvironments = results[1].data.data.testingEnvironments
        .filter(tenv => {
            let answerSets = tenv.answerSets;
            let completedAnswerSets = answerSets.filter(aset => {
                let answered = aset.answers
                    .filter(ans => ans.value != 'NOANSWER');
                return answered.length !== 0;
            });
            return completedAnswerSets.length === 0;
        });*/
    return res.render('admin/testing.html', 
        {
            publicTestingEnvironments,
            publicArchivedTestingEnvironments,
            unpublishedTestingEnvironments,
            unpublishedArchivedTestingEnvironments,
            getRequestToPublish: answerSetId => {
                let retval = requests.find(r => r.answerSetId === answerSetId);
                return retval;
            }
        }
    );
});

router.get('/testing-environment/:id', async (req, res, next) => {
    let dbres = await db.query(Q.TESTING_ENVIRONMENTS.GET, 
        { id: parseInt(req.params.id) }, 
        req.cookies.jwt);
    if (!dbres.success) {
        let err = new Error(`Could not get testing environment (${req.params.id}).`);
        return next(err);
    }
    let testingEnvironment = dbres.data.testingEnvironment;

    dbres = await db.query(Q.USERS.GET_ACTIVE, {}, req.cookies.jwt);
    if (!dbres.success) {
        let err = new Error(`Could not get active users.`);
        return next(err);
    }
    let users = dbres.data.getActiveUsers;
    
    dbres = await db.query(
        Q.REQUESTS.GET_FOR_ANSWERSETS, 
        { ids: testingEnvironment.answerSets.map(ans => ans.id)},
        req.cookies.jwt
    );
    if (!dbres.success) {
        let err = new Error(`Could not get requests.`);
        return next(err);
    }
    let requests = dbres.data.requests;
    return res.render('admin/testing-environment.html', 
        {
            testingEnvironment,
            users,
            getRequestToPublish: answerSetId => {
                let retval = requests.find(r => r.answerSetId === answerSetId);
                return retval;
            }
        }
    );
});

// admin test books
router.get('/upload-test-book', async (req, res, next) => {
    return res.render('admin/upload-test-book.html');
});

router.get('/test-books', async (req, res, next) => {
    let dbres = await db.query(Q.TEST_BOOKS.GET_LATEST, {});
    if (!dbres.success) {
        let err = new Error(`Could not get test books.`);
        return next(err);
    }
    
    return res.render('admin/test-books.html', 
        {
            testBooks: dbres.data.getLatestTestBooks,
            getTopicName: utils.getTopicName
        }
    );
});


// sort functions for users
let alpha = (a,b) => a.name > b.name ? 1 : a.name == b.name ? 0 : -1;
let alpha2 = (a,b) => a.user.name > b.user.name ? 1 : a.user.name == b.user.name ? 0 : -1;
    
// admin users
router.get('/users', async (req, res, next) => {
    dbres = await db.query(Q.USERS.GET_ACTIVE, {}, req.cookies.jwt);
    if (!dbres.success) {
        let err = new Error(`Could not get active users.`);
        return next(err);
    }
    let activeUsers = dbres.data.getActiveUsers;

    return res.render('admin/view-users.html', 
        {
            activeUsers: activeUsers.sort(alpha)
        }
    );
});

router.get('/invite-users', async(req, res, next) => {
    dbres = await db.query(Q.INVITATIONS.GET_ALL, {}, req.cookies.jwt);
    if (!dbres.success) {
        let err = new Error(`Could not get invitations.`);
        return next(err);
    }
    let invitations = dbres.data.invitations;

    return res.render('admin/invite-users.html', 
        {
            invitations: invitations.sort(alpha2)
        }
    );
});

router.get('/reinvite-users', async(req, res, next) => {
    let dbres = await db.query(Q.USERS.GET_INACTIVE, {}, req.cookies.jwt);
    if (!dbres.success) {
        let err = new Error(`Could not get inactive users.`);
        return next(err);
    }
    let inactiveUsers = dbres.data.getInactiveUsers;

    dbres = await db.query(Q.INVITATIONS.GET_ALL, {}, req.cookies.jwt);
    if (!dbres.success) {
        let err = new Error(`Could not get invitations.`);
        return next(err);
    }
    let invitations = dbres.data.invitations;

    // filter out users who've been invited
    inactiveUsers = inactiveUsers.filter(u => invitations.find(a => a.user.id === u.id) === undefined);
    
    return res.render('admin/reinvite-users.html', 
        {
            inactiveUsers: inactiveUsers.sort(alpha),
            duplicateName: name => inactiveUsers.filter(u => u.name === name).length > 1
        }
    );
});

router.get('/reading-system/:id', async (req, res, next) => {
    let software = await getSoftwareById(req, res, next, "ReadingSystem");
    return res.status(200).render('./admin/software.html', {software});
});
router.get('/assistive-technology/:id', async (req, res, next) => {
    let software = await getSoftwareById(req, res, next, "AssistiveTechnology");
    return res.status(200).render('./admin/software.html', {software});
});
router.get('/os/:id', async (req, res, next) => {
    let software = await getSoftwareById(req, res, next, "Os");
    return res.status(200).render('./admin/software.html', {software});
});
router.get('/browser/:id', async (req, res, next) => {
    let software = await getSoftwareById(req, res, next, "Browser");
    return res.status(200).render('./admin/software.html', {software});
});


router.get("/software", async (req, res, next) => {
    let allSw = await getAllSoftware(req.cookies.jwt);
    if (!allSw.success) {
        return next(allSw.error);
    }
    
    return res.render('admin/all-software.html', {
        readingSystems: allSw.readingSystems.sort(utils.sortAlpha),
        assistiveTechnologies: allSw.assistiveTechnologies.sort(utils.sortAlpha),
        operatingSystems: allSw.operatingSystems.sort(utils.sortAlpha),
        browsers: allSw.browsers.sort(utils.sortAlpha)
    });
});

router.get('/add-testing-environment', async (req, res, next) => {
    let allSw = await getAllSoftware(req.cookies.jwt, filterActive=true);
    if (!allSw.success) {
        return next(allSw.error);
    }

    let dbres = await db.query(Q.TOPICS.GET_ALL);
    if (!dbres.success) {
        let err = new Error("Could not get topics");
        return next(err);
    }
    let topics = dbres.data.topics;
    
    dbres = await db.query(Q.USERS.GET_ACTIVE, {}, req.cookies.jwt);
    if (!dbres.success) {
        let err = new Error("Could not get active users");
        return next(err);
    }
    let users = dbres.data.getActiveUsers;

    return res.render("admin/add-testing-environment.html", {
        readingSystems: allSw.readingSystems.sort(utils.sortAlpha),
        assistiveTechnologies: allSw.assistiveTechnologies.sort(utils.sortAlpha),
        operatingSystems: allSw.operatingSystems.sort(utils.sortAlpha),
        browsers: allSw.browsers.sort(utils.sortAlpha),
        getTopicName: utils.getTopicName,
        topics: topics.sort(utils.sortTopicOrder),
        users: users.sort(utils.sortAlphaUsers)
    });
});

router.get('/add-reading-system', (req, res) => res.render(
    'admin/add-edit-software.html', 
    {
        action: "/admin/forms/add-software",
        title: "Add Reading System",
        type: "READING_SYSTEM",
        showInDropdown: true
    })
);

router.get('/add-assistive-technology', (req, res) => res.render(
    'admin/add-edit-software.html', 
    {
        action: "/admin/forms/add-software",
        title: "Add Assistive Technology",
        type: "ASSISTIVE_TECHNOLOGY",
        showInDropdown: true
    })
);

router.get('/add-operating-system', (req, res) => res.render(
    'admin/add-edit-software.html', 
    {
        action: "/admin/forms/add-software",
        title: "Add Operating System",
        type: "OS",
        showInDropdown: true
    })
);

router.get('/add-browser', (req, res) => res.render(
    './admin/add-edit-software.html', 
    {
        action: "/admin/forms/add-software",
        title: "Add Browser",
        type: "BROWSER",
        showInDropdown: true
    })
);

router.get('/etc', (req, res) => {
    return res.status(200).render('./admin/etc.html');
});

router.get('/server-info', async (req, res, next) => {
    let dbres = await db.query(Q.ETC.DBVERSION, {}, req.cookies.jwt);
    
    if (!dbres.success) {
        let err = new Error("Error getting database version.");
        return next(err);
    }
    let info = `
    <pre>
    Database migration: ${dbres.data.dbInfo.value}
    Node version: ${process.version}
    </pre>
    `;
    return res.status(200).send(info);
});

router.get('/edit-reading-system/:id', async (req, res, next) => {
    let software = await getSoftwareById(req, res, next, "ReadingSystem");
    return res.render('./admin/add-edit-software.html', {title: "Edit Reading System", action: "/admin/forms/software", software});
});

router.get('/edit-assistive-technology/:id', async (req, res, next) => {
    let software = await getSoftwareById(req, res, next, "AssistiveTechnology");
    return res.render('./admin/add-edit-software.html', {title: "Edit Assistive Technology", action: "/admin/forms/software", software});
});

router.get('/edit-os/:id', async (req, res, next) => {
    let software = await getSoftwareById(req, res, next, "Os");
    return res.render('./admin/add-edit-software.html', {title: "Edit OS", action: "/admin/forms/software", software});
});

router.get('/edit-browser/:id', async (req, res, next) => {
    let software = await getSoftwareById(req, res, next, "Browser");
    return res.render('./admin/add-edit-software.html', {title: "Edit Browser", action: "/admin/forms/software", software});
});


async function getAllSoftware(jwt, filterActive = false) {
    try {
        let dbres = await db.query(Q.SOFTWARE.GET_ALL_BY_TYPE("ReadingSystem"), 
            {}, jwt);
        if (!dbres.success) {
            throw new Error(`Could not get reading systems`);
        }
        let readingSystems = aliasFieldArray(dbres.data.softwares, 
            "testingEnvironmentsByReadingSystemId", "testingEnvironments");
        if (filterActive) {
            readingSystems = readingSystems.filter(sw => sw.active);
        }
        
        dbres = await db.query(Q.SOFTWARE.GET_ALL_BY_TYPE("AssistiveTechnology"), 
            {}, jwt);
        if (!dbres.success) {
            throw new Error(`Could not get assistive technologies`);
        }
        let assistiveTechnologies = aliasFieldArray(dbres.data.softwares, 
            "testingEnvironmentsByAssistiveTechnologyId", "testingEnvironments");
        if (filterActive) {
            assistiveTechnologies = assistiveTechnologies.filter(sw => sw.active);
        }

        dbres = await db.query(Q.SOFTWARE.GET_ALL_BY_TYPE("Os"), 
            {}, jwt);
        if (!dbres.success) {
            throw new Error(`Could not get operating systems`);
        }
        let operatingSystems = aliasFieldArray(dbres.data.softwares, 
            "testingEnvironmentsByOsId", "testingEnvironments");
        if (filterActive) {
            operatingSystems = operatingSystems.filter(sw => sw.active);
        }

        dbres = await db.query(Q.SOFTWARE.GET_ALL_BY_TYPE("Browser"), 
            {}, jwt);
        if (!dbres.success) {
            throw new Error(`Could not get browsers`);
        }
        let browsers = aliasFieldArray(dbres.data.softwares,
            "testingEnvironmentsByBrowserId", "testingEnvironments");
        if (filterActive) {
            browsers = browsers.filter(sw => sw.active);
        }

        return {
            success: true, 
            error: null, 
            operatingSystems, 
            browsers, 
            readingSystems, 
            assistiveTechnologies};
    }
    catch(error) {
        return {
            success: false, 
            error, 
            operatingSystems: [], 
            browsers: [], 
            readingSystems: [], 
            assistiveTechnologies: []};
    }
}

// because of some annoying properties of graphql, we need to specify the type in order to get detailed usage info about the software
async function getSoftwareById(req, res, next, type) {
    let dbres = await db.query(Q.SOFTWARE.GET_EXTENDED(type), {id: parseInt(req.params.id)}, req.cookies.jwt);

    if (!dbres.success) {
        let err = new Error(`Error getting software (id=${req.params.id}).`)
        return next(err);
    }
    
    let software = dbres.data.software;
    if (type == "ReadingSystem") {
        software = aliasField(software, "testingEnvironmentsByReadingSystemId", "testingEnvironments")
    }
    else if (type == "AssistiveTechnology") {
        software = aliasField(software, "testingEnvironmentsByAssistiveTechnologyId", "testingEnvironments")
    }
    else if (type == "Os") {
        software = aliasField(software, "testingEnvironmentsByOsId", "testingEnvironments")
    }
    else if (type == "Browser") {
        software = aliasField(software, "testingEnvironmentsByBrowserId", "testingEnvironments")
    }
     
    return software;
}

// for an array of objects, create newField and populate it with the contents of oldField
function aliasFieldArray(objs, oldField, newField) {
    return objs.map(obj => aliasField(obj, oldField, newField));
}

function aliasField(obj, oldField, newField) {
    let newObj = obj;
    newObj[newField] = obj[oldField];
    return newObj;
}


module.exports = router;