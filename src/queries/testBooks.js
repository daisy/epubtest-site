import generate from './crudGenerator.js';
import * as tests from './tests.js';
import * as topics from './topics.js';

const BASIC_FIELDS = () => `
id
title
version
filename
description
translation
experimental
`;

const FIELDS = () => `
topic {
    ${topics.FIELDS()}
}
lang {
    id
}
${BASIC_FIELDS()}`;

// useful because the DB function getLatestTestBooks just returns the topicId
const FIELDS_WITHOUT_NESTING = () => `
${BASIC_FIELDS()}
topicId
langId
`;

const FIELDS_WITH_TESTS = () => `
${FIELDS()}
tests {
    ${tests.FIELDS()}
}
`

const {CREATE, DELETE, UPDATE, GET, GET_ALL} 
    = generate("testBook", "testBooks", FIELDS);

// get all the latest test books
const GET_LATEST = () => 
`query {
    getLatestTestBooks{
        ${FIELDS_WITHOUT_NESTING()}
    }
}`;

const DELETE_TEST_BOOK_AND_ANSWER_SETS = () => 
`mutation ($testBookId: Int!) {
    deleteTestBookAndAnswerSets(input:{testBookId: $testBookId}) {
        clientMutationId
    }
}`;

const GET_FOR_TOPIC = () => 
`query($id: String!) {
    testBooks(condition: {topicId: $id}) {
        ${FIELDS_WITH_TESTS()}
    }
}`;

export {
    FIELDS, FIELDS_WITH_TESTS, FIELDS_WITHOUT_NESTING,
    CREATE, DELETE, UPDATE, GET, GET_ALL, GET_LATEST, DELETE_TEST_BOOK_AND_ANSWER_SETS, GET_FOR_TOPIC
};