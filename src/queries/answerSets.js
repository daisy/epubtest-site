const generate  = require('./crudGenerator');
const answerSetFrag = require('./fragments/answerSetWithTestEnv');

const {CREATE, DELETE, UPDATE, GET, GET_ALL} 
    = generate("answerSet", "answerSets", answerSetFrag.FIELDS_WITH_ANSWERS);

const { GET: GET_EXTENDED, GET_ALL: GET_ALL_EXTENDED } 
    = generate("answerSet", "answerSets", answerSetFrag.FIELDS_WITH_ANSWERS_WITH_USER_LOGIN);


const GET_FOR_BOOK = 
    `query ($testBookId:Int!) {
        answerSets(condition:{testBookId: $testBookId}) {
            ${answerSetFrag.FIELDS_WITH_ANSWERS}
        }
    }
    `;

const GET_FOR_BOOK_AND_TESTING_ENVIRONMENT = 
`query ($testBookId:Int!, $testingEnvironmentId:Int!) {
    answerSets(condition:{testBookId: $testBookId, testingEnvironmentId: $testingEnvironmentId}) {
        ${answerSetFrag.FIELDS_WITH_ANSWERS}
    }
}
`;

const GET_FOR_BOOK_EXTENDED = 
`query ($testBookId:Int!) {
    answerSets(condition:{testBookId: $testBookId}) {
        ${answerSetFrag.FIELDS_WITH_ANSWERS_WITH_USER_LOGIN}
    }
}`;

const UPDATE_ANSWERSET_AND_ANSWERS =
    `mutation ($input: UpdateAnswersetAndAnswersInput!) {
        updateAnswersetAndAnswers(input: $input){
            clientMutationId
        }
    }`;

const GET_FOR_USER = 
`query ($userId:Int!) {
    answerSets(condition: {userId: $userId}) {
        ${answerSetFrag.FIELDS_WITH_ANSWERS}
    }
}`;

module.exports = {
    CREATE, DELETE, UPDATE, GET, GET_ALL, 
    GET_FOR_BOOK,
    GET_FOR_BOOK_AND_TESTING_ENVIRONMENT,
    UPDATE_ANSWERSET_AND_ANSWERS,
    GET_EXTENDED,
    GET_ALL_EXTENDED,
    GET_FOR_BOOK_EXTENDED,
    GET_FOR_USER
};

