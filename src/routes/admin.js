import express from 'express';
import * as db from '../database/index.js';
import * as Q from '../queries/index.js';
import * as displayUtils from '../displayUtils.js';
import * as utils from '../utils.js';
import semver from 'semver';

const router = express.Router()

router.get('/', async(req, res, next) => {
    let dbres = await db.query(Q.TOPICS.GET_ALL(),  {});
    if (!dbres.success) {
        let err = new Error("Could not get topics.");
        return next(err);
    }

    return res.render('admin/index.njk', 
    {
        topics: dbres.data.topics,
        displayUtils
    });
});

// admin requests
router.get('/requests', async (req, res, next) => {
    let dbres = await db.query(Q.REQUESTS.GET_ALL(),  {}, req.cookies.jwt);
    
    if (!dbres.success) {
        let err = new Error("Could not get requests.");
        return next(err);
    }
    
    return res.render('./admin/requests.njk', 
        { 
            requests: dbres.data.requests 
        }
    );
});

// admin testing
router.get('/testing-environments', async (req, res, next) => {
    let dbres = await db.query(Q.TESTING_ENVIRONMENTS.GET_ALL(),  {}, req.cookies.jwt);
    if (!dbres.success) {
        let err = new Error("Could not get testing environments.");
        return next(err);
    }
    let allTestEnvs = dbres.data.testingEnvironments;

    return res.render('admin/testing-environments.njk', 
        {
            testingEnvironments: allTestEnvs,
            displayUtils
        }
    );
});

router.get('/testing-environment/:id', async (req, res, next) => {
    let dbres = await db.query(Q.TESTING_ENVIRONMENTS_WITH_ANSWERS.GET(), 
        { id: parseInt(req.params.id) }, 
        req.cookies.jwt);
    if (!dbres.success) {
        let err = new Error(`Could not get testing environment (${req.params.id}).`);
        return next(err);
    }
    let testingEnvironment = dbres.data.testingEnvironment;
    if (testingEnvironment == null) {
        let err = new Error(`Could not get testing environment (${req.params.id}).`);
        return next(err);
    }
    dbres = await db.query(Q.USERS.GET_ACTIVE(), {}, req.cookies.jwt);
    if (!dbres.success) {
        let err = new Error(`Could not get active users.`);
        return next(err);
    }
    let users = dbres.data.getActiveUsers;
    
    dbres = await db.query(
        Q.REQUESTS.GET_FOR_ANSWERSETS(), 
        { ids: testingEnvironment.answerSets.map(ans => ans.id)},
        req.cookies.jwt
    );
    if (!dbres.success) {
        let err = new Error(`Could not get requests.`);
        return next(err);
    }
    let requests = dbres.data.requests;
    let publishRequests = {};
    testingEnvironment.answerSets.map(aset => {
        let foundRequest = requests.find(r => r.answerSet.id == aset.id);
        if (foundRequest) {
            publishRequests[aset.id] = foundRequest;
        }
    });

    return res.render('admin/testing-environment.njk', 
        {
            testingEnvironment,
            users,
            publishRequests,
            displayUtils
        }
    );
});

// admin test books
router.get('/add-test-book', async (req, res, next) => {
    return res.render('admin/upload-test-book.njk');
});

router.get('/test-books', async (req, res, next) => {
    let dbres = await db.query(Q.TEST_BOOKS.GET_ALL(), {});
    if (!dbres.success) {
        let err = new Error(`Could not get test books.`);
        return next(err);
    }
    let testBooks = dbres.data.testBooks.sort((a, b) => a.topic.order > b.topic.order ? 1 : -1)
    
    return res.render('admin/test-books.njk', 
        {
            testBooks,
            displayUtils
        }
    );
});


// sort functions for users
let alpha = (a,b) => a.name > b.name ? 1 : a.name == b.name ? 0 : -1;
let alpha2 = (a,b) => a.user.name > b.user.name ? 1 : a.user.name == b.user.name ? 0 : -1;
    
// admin users
router.get('/users', async (req, res, next) => {
    let dbres = await db.query(Q.USERS.GET_ACTIVE(), {}, req.cookies.jwt);
    if (!dbres.success) {
        let err = new Error(`Could not get active users.`);
        return next(err);
    }
    let activeUsers = dbres.data.getActiveUsers;

    // now get the user type, which is attached to the login
    for (let activeUser of activeUsers) {
        dbres = await db.query(Q.USERS.GET_EXTENDED(), {id: activeUser.id}, req.cookies.jwt);
        if (!dbres.success) {
            let err = new Error(`Could not get all user info.`);
            return next(err);
        }
        let userInfo = dbres.data.user;
        activeUser.type = userInfo.login.type;
    }   
    
    // experiment to show a user's assignments
    // practically speaking, there are too many (could be hundreds) for it to be meaningfully displayed
    // for (user of activeUsers) {
    //     dbres = await db.query(Q.ANSWER_SETS.GET_FOR_USER(), {
    //         userId: user.id
    //     },
    //     req.cookies.jwt);
    //     if (dbres.success) {
    //         user.assignments = dbres.data.answerSets
    //     }
    //     else {
    //         user.assignments = [];
    //     }
    // }

    return res.render('admin/view-users.njk', 
        {
            activeUsers: activeUsers.sort(alpha)
        }
    );
});

router.get('/invitations', async(req, res, next) => {
    let dbres = await db.query(Q.INVITATIONS.GET_ALL(),  {}, req.cookies.jwt);
    if (!dbres.success) {
        let err = new Error(`Could not get invitations.`);
        return next(err);
    }
    let invitations = dbres.data.invitations;

    return res.render('admin/invitations.njk', 
        {
            invitations: invitations.sort(alpha2)
        }
    );
});

router.get('/add-user', async(req, res, next) => {
    return res.render('admin/invite-user.njk');
});

router.get('/reinvite-users', async(req, res, next) => {
    let dbres = await db.query(Q.USERS.GET_INACTIVE(), {}, req.cookies.jwt);
    if (!dbres.success) {
        let err = new Error(`Could not get inactive users.`);
        return next(err);
    }
    let inactiveUsers = dbres.data.getInactiveUsers;

    dbres = await db.query(Q.INVITATIONS.GET_ALL(),  {}, req.cookies.jwt);
    if (!dbres.success) {
        let err = new Error(`Could not get invitations.`);
        return next(err);
    }
    let invitations = dbres.data.invitations;

    // filter out users who've been invited
    inactiveUsers = inactiveUsers.filter(u => invitations.find(a => a.user.id === u.id) === undefined);
    
    return res.render('admin/reinvite-users.njk', 
        {
            inactiveUsers: inactiveUsers.sort(alpha),
            duplicateName: name => inactiveUsers.filter(u => u.name === name).length > 1
        }
    );
});

router.get("/software/:id", async (req, res, next) => {
    let result = await getSoftwareById(parseInt(req.params.id), req.cookies.jwt);
    if (!result.success) {
        let err = new Error ("Could not get software");
        return next(err);
    }
    return res.status(200).render('./admin/software.njk', {software: result.software, displayUtils});
});

router.get("/all-software/:type", async (req, res, next) => {
    let softwareTypeLabel = utils.getSoftwareTypeLabels(req.params.type);

    let allSw = await getAllSoftware(softwareTypeLabel?.queryLabel, req.cookies.jwt);
    if (!allSw.success) {
        return next(allSw.error);
    }
    
    return res.render('admin/all-software.njk', {
        title: softwareTypeLabel?.humanLabelPlural,
        software: allSw.software.sort(utils.sortAlpha)
    });
});


router.get('/add-testing-environment', async (req, res, next) => {
    let allRs = await getAllSoftware("ReadingSystem", req.cookies.jwt, true);
    if (!allRs.success) {
        return next(allRs.error);
    }

    let allAt = await getAllSoftware("AssistiveTechnology", req.cookies.jwt, true);
    if (!allAt.success) {
        return next(allAt.error);
    }

    let allOs = await getAllSoftware("Os", req.cookies.jwt, true);
    if (!allOs.success) {
        return next(allOs.error);
    }

    let allBrowser = await getAllSoftware("Browser", req.cookies.jwt, true);
    if (!allBrowser.success) {
        return next(allBrowser.error);
    }

    let allDevice = await getAllSoftware("Device", req.cookies.jwt, true);
    if (!allDevice.success) {
        return next(allDevice.error);
    }

    return res.render("admin/add-edit-testing-environment.njk", {
        title: "Add testing environment",
        readingSystems: allRs.software.sort(utils.sortAlpha),
        assistiveTechnologies: allAt.software.sort(utils.sortAlpha),
        operatingSystems: allOs.software.sort(utils.sortAlpha),
        browsers: allBrowser.software.sort(utils.sortAlpha),
        devices: allDevice.software.sort(utils.sortAlpha),
        getSoftwareTypeLabels: utils.getSoftwareTypeLabels,
        action: "/admin/forms/add-testing-environment",
        matches: (a, b, c) => false // this function is useful for editing but not adding
    });
});

router.get('/add-software/:type', (req, res) => {
    let label = utils.getSoftwareTypeLabels(req.params.type);
    return res.render('admin/add-edit-software.njk', 
    {
        action: "/admin/forms/add-software",
        title: `Add ${label.humanLabel}`,
        type: label.dbEnum,
        showInDropdown: true
    });
});

router.get('/etc', (req, res) => {
    return res.status(200).render('./admin/etc.njk');
});

router.get('/server-info', async (req, res, next) => {
    let dbres = await db.query(Q.ETC.DBVERSION(), {}, req.cookies.jwt);
    
    if (!dbres.success) {
        let err = new Error("Error getting database version.");
        return next(err);
    }
    let items = [
        {name: "Database migration", value: dbres.data.dbInfo.value},
        {name: "Node version", value: process.version}
    ];
    return res.render("./admin/server-information.njk", {items});
});
router.get('/edit-software/:id', async (req, res, next) => {
    let result = await getSoftwareById(parseInt(req.params.id), req.cookies.jwt);
    if (!result.success) {
        let err = new Error ("Could not get software");
        return next(err);
    }
    let software = result.software;
    let label = utils.getSoftwareTypeLabels(software.type)?.humanLabel;
    return res.render('./admin/add-edit-software.njk', {title: `Edit ${label}`, action: "/admin/forms/software", software});
});
router.get('/edit-testing-environment/:id', async (req, res, next) => {
    let id = parseInt(req.params.id);
    let jwt = req.cookies.jwt;
    let dbres = await db.query(Q.TESTING_ENVIRONMENTS.GET(), {id}, jwt);
    if (!dbres.success) {
        let err = new Error(`Error getting software (id=${id}).`)
        return next(err);
    }
    let testingEnvironment = dbres.data.testingEnvironment;

    let allRs = await getAllSoftware("ReadingSystem", req.cookies.jwt);
    if (!allRs.success) {
        return next(allRs.error);
    }
    // the testing environment's reading system may not appear in the list, if it's not marked "show in list"
    // if (!allRs.software.map(sw => sw.id).includes(testingEnvironment.readingSystem.id)) {
    //     allRs.software.push(testingEnvironment.readingSystem);
    // }

    let allAt = await getAllSoftware("AssistiveTechnology", req.cookies.jwt);
    if (!allAt.success) {
        return next(allAt.error);
    }
    // the testing environment's AT may not appear in the list
    // if (testingEnvironment.assistiveTechnology 
    //     && !allAt.software.map(sw => sw.id).includes(testingEnvironment.assistiveTechnology.id)) {
    //     allAt.software.push(testingEnvironment.assistiveTechnology);
    // }

    let allOs = await getAllSoftware("Os", req.cookies.jwt);
    if (!allOs.success) {
        return next(allOs.error);
    }
    // the testing environment's os may not appear in the list
    // if (testingEnvironment.os 
    //     && !allOs.software.map(sw => sw.id).includes(testingEnvironment.os.id)) {
    //     allOs.software.push(testingEnvironment.os);
    // }

    let allBrowser = await getAllSoftware("Browser", req.cookies.jwt);
    if (!allBrowser.success) {
        return next(allBrowser.error);
    }
    // the testing environment's browser may not appear in the list
    // if (testingEnvironment.browser 
    //     && !allOs.software.map(sw => sw.id).includes(testingEnvironment.browser.id)) {
    //     allBrowser.software.push(testingEnvironment.browser);
    // }

    let allDevice = await getAllSoftware("Device", req.cookies.jwt);
    if (!allDevice.success) {
        return next(allDevice.error);
    }
    // the testing environment's device may not appear in the list
    // if (testingEnvironment.device 
    //     && !allDevice.software.map(sw => sw.id).includes(testingEnvironment.device.id)) {
    //     allDevice.software.push(testingEnvironment.device);
    // }

    return res.render('./admin/add-edit-testing-environment.njk', {
        title: "Edit testing environment",
        readingSystems: allRs.software.sort(utils.sortAlpha),
        assistiveTechnologies: allAt.software.sort(utils.sortAlpha),
        operatingSystems: allOs.software.sort(utils.sortAlpha),
        browsers: allBrowser.software.sort(utils.sortAlpha),
        devices: allDevice.software.sort(utils.sortAlpha),
        getSoftwareTypeLabels: utils.getSoftwareTypeLabels,
        testingEnvironment,
        action: `/admin/forms/testing-environment/${testingEnvironment.id}`,
        // does the testing environment use this particular piece of software in the given role? 
        matches: (testEnv, swtype, sw) => {
            // sw is null and testEnv has nothing for that sw type, aka "None"
            let nullMatch = !testEnv[swtype] && sw == null;
            // sw matches testEnv[swtype] field
            let match = testEnv[swtype] && sw && testEnv[swtype].id == sw.id;
            let retval = nullMatch || match;
            
            return retval;
        }
    });
});

router.get("/assignments", async(req, res, next) => {
    let dbres = await db.query(Q.ANSWER_SETS.GET_ALL_EXTENDED(), {}, req.cookies.jwt);
    if (!dbres.success) {
        let err = new Error(`Could not get answer sets`);
        return next(err);
    }
    let answerSets = dbres.data.answerSets.filter(aset => aset.user?.login?.type != 'ADMIN' && aset.user != null);
    return res.render('./admin/assignments.njk', {answerSets});
});

router.get("/results/:topicId", async(req, res, next) => {
    let dbres = await db.query(Q.TEST_BOOKS.GET_FOR_TOPIC(), {
        id: req.params.topicId
    });
    if (!dbres.success) {
        let err = new Error('Could not get test book(s) for topic');
        return next(err);
    }
    
    let allAnswerSets = [];
    for (let testBook of dbres.data.testBooks) {
        dbres = await db.query(
            Q.ANSWER_SETS.GET_FOR_BOOK(),
            {testBookId: testBook.id},
            req.cookies.jwt
        );
        if (!dbres.success) {
            let err = new Error(`Could not get answer sets for test book (id=${testBook.id})`);
            return next(err);
        }
        allAnswerSets.push(dbres.data.answerSets);
    }
    allAnswerSets = allAnswerSets.flat();

    return res.render('./admin/results-by-topic.njk', 
        {
            topicId: req.params.topicId,
            allAnswerSets: allAnswerSets,
            displayUtils
        });
});

async function getAllSoftware(type, jwt, filterActive = false) {
    try {
        let dbres = await db.query(Q.SOFTWARE.GET_ALL_BY_TYPE(type), 
            {}, jwt);
        if (!dbres.success) {
            throw new Error(`Could not get software of type ${type}`);
        }
        let software = aliasFieldArray(dbres.data.softwares, 
            `testingEnvironmentsBy${type}Id`, "testingEnvironments");
        if (filterActive) {
            software = software.filter(sw => sw.active);
        }
        
        
        return {
            success: true, 
            error: null, 
            software
        };
    }
    catch(error) {
        return {
            success: false, 
            error, 
            software: []
        };
    }
}

async function getSoftwareById(id, jwt) {
    let errors = [];
    try {
        // first, find out the type of the software
        let dbres = await db.query(Q.SOFTWARE.GET(), {id}, jwt);
        if (!dbres.success) {
            let err = new Error(`Error getting software (id=${id}).`)
            errors.push(err);
        }

        // then get more details based on its type
        // because of some annoying properties of graphql, we need to specify the type in order to get detailed usage info about the software
        let type = dbres.data.software.type;
        let softwareTypeLabel = utils.getSoftwareTypeLabels(type);
        dbres = await db.query(Q.SOFTWARE.GET_EXTENDED(softwareTypeLabel.queryLabel), {id}, jwt);

        if (!dbres.success) {
            let err = new Error(`Error getting software (id=${id}).`)
            errors.push(err);
        }
        
        let software = dbres.data.software;
        if (type == "READING_SYSTEM") {
            software = aliasField(software, "testingEnvironmentsByReadingSystemId", "testingEnvironments")
        }
        else if (type == "ASSISTIVE_TECHNOLOGY") {
            software = aliasField(software, "testingEnvironmentsByAssistiveTechnologyId", "testingEnvironments")
        }
        else if (type == "OS") {
            software = aliasField(software, "testingEnvironmentsByOsId", "testingEnvironments")
        }
        else if (type == "BROWSER") {
            software = aliasField(software, "testingEnvironmentsByBrowserId", "testingEnvironments")
        }
        else if (type == "DEVICE") {
            software = aliasField(software, "testingEnvironmentsByDeviceId", "testingEnvironments")
        }
        
        return {
            success: true,
            errors: [],
            software
        };
    }
    catch(err) {
        return {
            success: false,
            errors,
            software: null
        };
    }
}

// for an array of objects, create newField and populate it with the contents of oldField
function aliasFieldArray(objs, oldField, newField) {
    return objs.map(obj => aliasField(obj, oldField, newField));
}

function aliasField(obj, oldField, newField) {
    let newObj = {...obj};
    if (obj.hasOwnProperty(oldField)) {
        newObj[newField] = obj[oldField];
    }
    return newObj;
}


export { router };