var jwt = require('jsonwebtoken');

function parseToken (token) {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded && decoded.expires > Date.now().valueOf() / 1000) {
            return {
                accessLevel: decoded.role === 'epubtest_user_role' ? 'user' 
                : 
                decoded.role === 'epubtest_admin_role' ? 'admin' : 'public',
                userId: decoded.user_id,
                expires: decoded.expires
            }
        }
        else {
            return null;
        }
        
    }
    catch(err) {
        return null;
    }
}

// hack: english only for now
const topicNames = {
    "basic-functionality": "Basic Functionality",
    "visual-adjustments": "Visual Adjustments",
    "non-visual-reading": "Non-Visual Reading",
    "read-aloud": "Read Aloud",
    "media-overlays": "Media Overlays",
    "extended-descriptions": "Extended Descriptions",
    "math": "Mathematics"
}
function getTopicName(id) {
    let retval = topicNames.hasOwnProperty(id) ? topicNames[id] : '';
    return retval;
}

let makeName = rs => `${rs.name}${rs.version != 'undefined' && rs.version != 'null' ? rs.version : ''}`;
let sortAlpha = (a,b) => makeName(a) > makeName(b) ? 1 : makeName(a) === makeName(b) ? 0 : -1;
let sortAlphaTestEnv = (a,b) => makeName(a.readingSystem) > makeName(b.readingSystem) ? 1 
    : makeName(a.readingSystem) === makeName(b.readingSystem) ? 0 : -1;
let sortAlphaUsers = (a,b) => a.name > b.name ? 1 : a.name === b.name ? 0 : -1;

let sortTopicOrder = (a,b) => a.order > b.order ? 1 : -1;
module.exports = {
    parseToken,
    getTopicName,
    sortAlpha,
    sortAlphaTestEnv,
    sortTopicOrder,
    sortAlphaUsers
}
