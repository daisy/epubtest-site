import generate from './crudGenerator.js';
import * as tests from './tests.js';
import * as topics from './topics.js';

const BASIC_FIELDS = () => `
id
epubId
title
version
filename
description
translation
experimental
isLatest
`;

const FIELDS = () => `
topic {
    ${topics.FIELDS()}
}
lang {
    id
}
${BASIC_FIELDS()}`;

const CREATE_FIELDS = () => `
${BASIC_FIELDS()}
version_major
version_minor
version_patch
`;

// useful because the DB function getLatestTestBooks just returns the topicId
// we aren't using that function anymore but probably some things rely on these fields being present
// so we're going to leave them
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

// X0...X3 are throwaway vars
let {X0, DELETE, UPDATE, GET, GET_ALL} 
    = generate("testBook", "testBooks", FIELDS);

// use different field set for creating a book than for delete, update, etc.
let {CREATE, X1, X2, X3} 
    = generate("testBook", "testBooks", CREATE_FIELDS);

// get all the latest test books
// we're also going to add the topic order field to make it easier to keep them in order
const GET_LATEST = () =>
`query {
    testBooks(condition: {isLatest: true}) {
        ${FIELDS_WITHOUT_NESTING()}
        topic {
            order
        }
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

const IS_LATEST = () => 
` query($id: String!) {
    isLatestTestBook{
        id
    }
}`;

const UPDATE_SET_IS_LATEST_FOR_ALL = () =>
` mutation {
    updateTestBooksIsLatest(
        input:{}
      ) {
        clientMutationId
        query{
          testBooks {
            id
          }
        }
      }
}`;

const GET_BY_EPUB_ID = () => 
`query($id: String!) {
    testBooks(condition: {epubId: $id}) {
        ${FIELDS_WITH_TESTS()}
    }
}`;

const GET_BY_TOPIC_VERSION = () => 
`query($topicId: String!, $version: String!) {
    testBooks(condition: {topicId: $topicId, version: $version}) {
        ${FIELDS_WITH_TESTS()}
    }
}`;

export {
    FIELDS, FIELDS_WITH_TESTS, FIELDS_WITHOUT_NESTING,
    CREATE, DELETE, UPDATE, GET, GET_ALL, GET_LATEST, DELETE_TEST_BOOK_AND_ANSWER_SETS, GET_FOR_TOPIC,
    IS_LATEST, UPDATE_SET_IS_LATEST_FOR_ALL, GET_BY_EPUB_ID, GET_BY_TOPIC_VERSION
};