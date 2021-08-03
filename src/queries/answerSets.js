import generate from './crudGenerator.js';
import * as answers from "./answers.js";
import * as testBooks from "./testBooks.js";
import * as users from './users.js';
import * as testEnvs from "./testingEnvironments.js";
import * as privateAccessTokens from './privateAccessTokens.js';

const BASIC_FIELDS = () => `
id
summary
flag
score
isPublic
isLatest
isLatestPublic
isTested
lastModified
testBook {
    ${testBooks.FIELDS()}
}
`;

const FIELDS = () => `
${BASIC_FIELDS()}
user {
    ${users.FIELDS()}
}
testingEnvironment {
    ${testEnvs.BASIC_FIELDS()} 
}
privateAccessTokens {
    ${privateAccessTokens.BASIC_FIELDS()}
}`;

const FIELDS_WITH_USER_LOGIN = () => `
${BASIC_FIELDS()}
user {
    ${users.FIELDS_WITH_LOGIN()}
}
`;

const FIELDS_WITH_ANSWERS = () => `
${FIELDS()}
answers {
    ${answers.FIELDS()}
}
`;

const FIELDS_WITH_ANSWERS_WITH_USER_LOGIN = () => `
${FIELDS_WITH_USER_LOGIN()}
answers {
    ${answers.FIELDS()}
}
`;


// const FIELDS_WITH_TEST_ENV = () => `
// ${FIELDS()}
// testingEnvironment {
//     ${testEnvs.BASIC_FIELDS()} 
// }
// `;

// const FIELDS_WITH_ANSWERS_WITH_TEST_ENV = () => `
// ${FIELDS()}
// answers {
//     ${answers.FIELDS()}
// }
// testingEnvironment {
//     ${testEnvs.BASIC_FIELDS()} 
// }
// `;

const {CREATE, DELETE, UPDATE, GET, GET_ALL} 
    = generate("answerSet", "answerSets", FIELDS_WITH_ANSWERS);

const { GET: GET_EXTENDED, GET_ALL: GET_ALL_EXTENDED } 
    = generate("answerSet", "answerSets", FIELDS_WITH_ANSWERS_WITH_USER_LOGIN);

// const { GET: GET_WITH_TEST_ENV, GET_ALL: GET_ALL_WITH_TEST_ENV}
//     = generate("answerSet", "answerSets", FIELDS_WITH_ANSWERS_WITH_TEST_ENV);

// const GET_FOR_BOOK = () => 
//     `query ($testBookId:Int!) {
//         answerSets(condition:{testBookId: $testBookId}) {
//             ${FIELDS_WITH_ANSWERS_WITH_TEST_ENV()}
//         }
//     }
//     `;

const GET_FOR_BOOK = () => 
    `query ($testBookId:Int!) {
        answerSets(condition:{testBookId: $testBookId}) {
            ${FIELDS_WITH_ANSWERS()}
        }
    }
    `;

const GET_FOR_BOOK_AND_TESTING_ENVIRONMENT = () => 
`query ($testBookId:Int!, $testingEnvironmentId:Int!) {
    answerSets(condition:{testBookId: $testBookId, testingEnvironmentId: $testingEnvironmentId}) {
        ${FIELDS_WITH_ANSWERS()}
    }
}
`;

const GET_FOR_BOOK_EXTENDED = () => 
`query ($testBookId:Int!) {
    answerSets(condition:{testBookId: $testBookId}) {
        ${FIELDS_WITH_ANSWERS_WITH_USER_LOGIN()}
    }
}`;

const UPDATE_ANSWERSET_AND_ANSWERS = () => 
    `mutation ($input: UpdateAnswersetAndAnswersInput!) {
        updateAnswersetAndAnswers(input: $input){
            clientMutationId
        }
    }`;

const GET_FOR_USER = () => 
`query ($userId:Int!) {
    answerSets(condition: {userId: $userId}) {
        ${FIELDS_WITH_ANSWERS()}
    }
}`;

export {
    FIELDS, FIELDS_WITH_ANSWERS, FIELDS_WITH_USER_LOGIN, FIELDS_WITH_ANSWERS_WITH_USER_LOGIN,
    //FIELDS_WITH_TEST_ENV,
    CREATE, DELETE, UPDATE, GET, GET_ALL, 
    GET_FOR_BOOK,
    GET_FOR_BOOK_AND_TESTING_ENVIRONMENT,
    UPDATE_ANSWERSET_AND_ANSWERS,
    GET_EXTENDED,
    GET_ALL_EXTENDED,
    GET_FOR_BOOK_EXTENDED,
    GET_FOR_USER,
    // GET_WITH_TEST_ENV,
    // GET_ALL_WITH_TEST_ENV
};

