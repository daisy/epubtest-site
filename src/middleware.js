// MIDDLEWARE FUNCTIONS
const utils = require('./utils');

function isAuthenticated (req, res, next) {
    const token = utils.parseToken(req.cookies.jwt);
    if (token) {
        return next();
    }
    return res.redirect('/login');
}

function isAdmin(req, res, next) {
    const token = utils.parseToken(req.cookies.jwt);
    if (token.accessLevel == 'admin') {
        return next();
    }
    return res.redirect('/login');
}

function accessLevel (req, res, next) {
    if (!req || !req.cookies || !req.cookies.jwt) {
        req.accessLevel = 'public';
        return next();
    }
    const token = utils.parseToken(req.cookies.jwt);
    if (token) {
        req.accessLevel = token.accessLevel;
        req.userId = token.userId;
    }
    else {
        req.accessLevel = 'public';
    }
    return next();
}

module.exports = {
    isAuthenticated, 
    isAdmin,
    accessLevel
}