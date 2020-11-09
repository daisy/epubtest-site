const generate  = require('./crudGenerator');
const softwareFrag = require('./fragments/software');
const testEnvFrag = require('./fragments/testingEnvironment');

const {CREATE, DELETE, UPDATE, GET, GET_ALL} 
    = generate("software", "softwares", softwareFrag.FIELDS);

// type = ReadingSystem, AssistiveTechnology, Browser, Os
// have to convert type to READING_SYSTEM, ASSISTIVE_TECHNOLOGY, etc
let GET_ALL_BY_TYPE = type => `
query {
    softwares(condition: {type: ${type.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase()}}) {
        ${softwareFrag.FIELDS}
        testingEnvironmentsBy${type}Id {
            ${testEnvFrag.FIELDS}
        }
    }
}`;

// type = ReadingSystem, AssistiveTechnology, Browser, Os
let GET_EXTENDED = type => `
    query ($id: Int!) {
        software(id: $id) {
            ${softwareFrag.FIELDS}
            testingEnvironmentsBy${type}Id {
                ${testEnvFrag.FIELDS}
            }
        }
    }`;

module.exports = {
    CREATE, DELETE, UPDATE, GET, GET_ALL, 
    GET_EXTENDED, GET_ALL_BY_TYPE
};
