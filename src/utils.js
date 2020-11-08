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

const softwareTypeLabels = [
    {
        dbEnum: "READING_SYSTEM",
        queryLabel: "ReadingSystem",
        humanLabel: "Reading System",
        humanLabelPlural: "Reading Systems",
        addressPart: "reading-system"
    },
    {
        dbEnum: "ASSISTIVE_TECHNOLOGY",
        queryLabel: "AssistiveTechnology",
        humanLabel: "Assistive Technology",
        humanLabelPlural: "AssistiveTechnologies",
        addressPart: "assistive-technology"
    },
    {
        dbEnum: "OS",
        queryLabel: "Os",
        humanLabel: "Operating System",
        humanLabelPlural: "Operating Systems",
        addressPart: "os"
    },
    {
        dbEnum: "BROWSER",
        queryLabel: "Browser",
        humanLabel: "Browser",
        humanLabelPlural: "Browsers",
        addressPart: "browser"
    },
    {
        dbEnum: "DEVICE",
        queryLabel: "Device",
        humanLabel: "Device",
        humanLabelPlural: "Devices",
        addressPart: "device"
    }
];

let getSoftwareTypeLabels = (value) => {
    let match = softwareTypeLabels.find(entry => 
        entry.dbEnum.toLowerCase() == value.toLowerCase()
        || entry.queryLabel.toLowerCase() == value.toLowerCase() 
        || entry.humanLabel.toLowerCase() == value.toLowerCase()
        || entry.addressPart.toLowerCase() == value.toLowerCase());
    return match ?? null;
};

let makeName = rs => `${rs.name}${rs.version != 'undefined' && rs.version != 'null' ? rs.version : ''}`;
let sortAlpha = (a,b) => makeName(a) > makeName(b) ? 1 : makeName(a) === makeName(b) ? 0 : -1;
let sortAlphaTestEnv = (a,b) => makeName(a.readingSystem) > makeName(b.readingSystem) ? 1 
    : makeName(a.readingSystem) === makeName(b.readingSystem) ? 0 : -1;
let sortAlphaUsers = (a,b) => a.name > b.name ? 1 : a.name === b.name ? 0 : -1;

let sortTopicOrder = (a,b) => a.order > b.order ? 1 : -1;
module.exports = {
    parseToken,
    sortAlpha,
    sortAlphaTestEnv,
    sortTopicOrder,
    sortAlphaUsers,
    getSoftwareTypeLabels
}
