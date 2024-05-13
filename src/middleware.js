// MIDDLEWARE FUNCTIONS
import * as utils from './utils.js';
// import i18next from 'i18next';
import dayjs from 'dayjs';

function isAuthenticated (req, res, next) {
    if (process.env.READONLY == 'true') {
        return res.redirect(`/`);
    }
    const token = utils.parseToken(req.cookies.jwt);
    if (token) {
        return next();
    }
    return res.redirect(`/login?next=${req.originalUrl}`);
}

function isAdmin(req, res, next) {
    const token = utils.parseToken(req.cookies.jwt);
    if (token.accessLevel == 'admin') {
        return next();
    }
    return res.redirect(`/login?next=${req.originalUrl}`);
}

function accessLevel (req, res, next) {
    if (!req || !req.cookies || !req.cookies.jwt) {
        res.locals.accessLevel = 'public';
    }
    else {
        let token = utils.parseToken(req.cookies.jwt);
        if (token) {
            res.locals.accessLevel = token.accessLevel;
            req.userId = token.userId;
        }
        else {
            res.locals.accessLevel = 'public';
        }
    }
    return next();
}

function readOnly(req, res, next) {
    res.locals.readOnly = process.env.READONLY == 'true';
    return next();
}

// make dayjs available everywhere
function addDayJS(req, res, next) {
    if (res) {
        res.locals.dayjs = dayjs;
    }
    return next();
}

async function currentLanguage (req, res, next) {
    
    // if (!req || !req.cookies || !req.cookies.currentLanguage) {
    //     res.locals.currentLanguage = 'en';
    //     await i18next.changeLanguage('en');
    //     //i18next.language = 'en';
    // }
    // else {
    //     res.locals.currentLanguage = req.cookies.currentLanguage;
    //     await i18next.changeLanguage(req.cookies.currentLanguage);
        
    //    // i18next.language = req.cookies.currentLanguage;
    // }
    // console.log("LANG IS NOW ", i18next.language);
    return next();
}

async function translate (req, res, next) {
    // if (!req) {
    //     res.locals.t = str => str;
    // }
    // else {
    //     res.locals.t = i18next.t;
    // }
    return next();
}

function error (err, req, res, next) {
    //console.log("Error: ", err?.statusCode);
    // use a generic status code if not present
    if (!err.statusCode) {
        err.statusCode = 500;
    }
    res.status(err.statusCode).render('error.njk', {
        error: err
    });
}

export {
    isAuthenticated, 
    isAdmin,
    addDayJS,
    accessLevel,
    error,
    currentLanguage,
    translate,
    readOnly
}