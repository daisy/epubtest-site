const testFrag = require('./test');
const topicFrag = require('./topic');
const BASIC_FIELDS = `
id
title
version
filename
description
translation
experimental
`;

const FIELDS = `
topic {
    ${topicFrag.FIELDS}
}
lang {
    id
}
${BASIC_FIELDS}`;

// useful because the DB function getLatestTestBooks just returns the topicId
const FIELDS_WITHOUT_NESTING = `
${BASIC_FIELDS}
topicId
langId
`;

const FIELDS_WITH_TESTS = `
${FIELDS}
tests {
    ${testFrag.FIELDS}
}
`

module.exports = { FIELDS, FIELDS_WITH_TESTS, FIELDS_WITHOUT_NESTING };