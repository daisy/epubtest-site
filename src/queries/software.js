import generate from './crudGenerator.js';
import * as testEnvs from './testingEnvironments.js';

const FIELDS = () => `
id
name
version
vendor
notes
type
active`;

const {CREATE, DELETE, UPDATE, GET, GET_ALL} 
    = generate("software", "softwares", FIELDS);

// type = ReadingSystem, AssistiveTechnology, Browser, Os
// have to convert type to READING_SYSTEM, ASSISTIVE_TECHNOLOGY, etc
let GET_ALL_BY_TYPE = type => `
query {
    softwares(condition: {type: ${type.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase()}}) {
        ${FIELDS()}
        testingEnvironmentsBy${type}Id {
            ${testEnvs.FIELDS()}
        }
    }
}`;

// type = ReadingSystem, AssistiveTechnology, Browser, Os
let GET_EXTENDED = type => `
    query ($id: Int!) {
        software(id: $id) {
            ${FIELDS()}
            testingEnvironmentsBy${type}Id {
                ${testEnvs.FIELDS()}
            }
        }
    }`;

export {
    FIELDS,
    CREATE, DELETE, UPDATE, GET, GET_ALL, 
    GET_EXTENDED, GET_ALL_BY_TYPE
};
