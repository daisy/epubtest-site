import generate from './crudGenerator.js';
import * as answerSets from './answerSets.js';

// const FIELDS = () => `
// id
// created
// answerSet {
//     ${answerSets.FIELDS_WITH_TEST_ENV()}
// }`;


const FIELDS = () => `
id
created
answerSet {
    ${answerSets.FIELDS()}
}`;

const {CREATE, DELETE, UPDATE, GET, GET_ALL} 
    = generate("request", "requests", FIELDS);

const GET_FOR_ANSWERSETS = () => 
    `query($ids: [Int!]) {
        requests(filter:{answerSetId:{in: $ids}}) {
            ${FIELDS()}
        }
    }`;

export {
    FIELDS,
    CREATE, DELETE, UPDATE, GET, GET_ALL, GET_FOR_ANSWERSETS
};
