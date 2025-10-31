import generate from './crudGenerator.js';
import * as answerSets from "./answerSets.js";

const BASIC_FIELDS = () => `
id
token
dateCreated
key
`;

const FIELDS = () => `
${BASIC_FIELDS()}
answerSetId`;
// can't attach answer set because viewer might not have permission
// answerSet {
//     ${answerSets.FIELDS()}
// }`;

const {CREATE, DELETE, UPDATE, GET, GET_ALL} 
    = generate("privateAccessToken", "privateAccessTokens", FIELDS);

const GET_FOR_KEY = () => `query ($key:String!) {
    privateAccessTokens(condition:{key: $key}) {
        ${FIELDS()}
    }
}
`;

export {
    BASIC_FIELDS, FIELDS, 
    CREATE, DELETE, UPDATE, GET, GET_ALL, GET_FOR_KEY
};

