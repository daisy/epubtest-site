const EPUB = require('../epub-parser/epub');
const db = require('../database');
const Q = require('../queries');

async function parse(epubFilepath, epubOrigFilename) {
    let testBook;
    try {
        let epub = new EPUB(epubFilepath);
        let epubx = await epub.extract();
        let bookdata = await epubx.parse();
        testBook = {
            title: bookdata.metadata['dc:title'],
            topicId: bookdata.metadata['dc:subject'],
            description: bookdata.metadata['dc:description'],
            langId: bookdata.metadata['dc:language'],
            epubId: bookdata.metadata['dc:identifier'],
            version: bookdata.metadata['schema:version'],
            filename: epubOrigFilename,
            path: epubFilepath,
            tests: bookdata.navDoc.testsData.map((t, idx)=>({
                testId: t.id,
                xhtml: t.xhtml,
                order: idx,
                flag: false,
                name: t.name,
                description: t.description
            })),
        }
        
        // TODO compare versions
        /*
        let result = await db.query(Q.TEST_BOOKS.GET_LATEST, {});
        let currentLatestForTopic = result.data.data.getLatestTestBooks.nodes
            .find(book => book.topicId === bookdata.metadata['dc:subject']);
        let testsInCurrent = await db.query(Q.TESTS.GET_FOR_BOOK, 
        {testBookId: parseInt(currentLatestForTopic.id)});
        testsInCurrent = testsInCurrent.data.data.tests;

        */
        // if MAJ + MIN are the same, do not suggest any flags
        // if MIN is different, suggest some as flagged
        // if MAJ is different, suggest all as flagged

    }
    catch(err) {
        testBook = null;
    }
    
    
    return testBook;
}

// returns {success: bool, errors: []}
async function add(testBook, jwt) {
    let errors = [];

    try {
        let dbres = await db.query(Q.TEST_BOOKS.ADD, {
            topicId: testBook.topicId,
            langId: testBook.langId,
            version: testBook.version,
            title: testBook.title,
            description: testBook.description,
            filename: testBook.filename,
            epubId: testBook.epubId
        }, req.cookies.jwt);

        if (!dbres.success) {
            errors = dbres.errors;
            throw new Error();
        }
        else {
            let i;
            for (i=0; i<testBook.tests.length; i++) {
                let test = testBook.tests[i];
                dbres = await db.query(Q.TESTS.ADD, {
                    testId: test.testId,
                    testBookId: parseInt(addBookResult.id),
                    name: test.name,
                    description: test.description,
                    xhtml: test.xhtml,
                    order: i,
                    flag: test.flag
                }, req.cookies.jwt);
                if (!dbres.success) {
                    errors = dbres.errors;
                    throw new Error();                }
            }

            // TODO add tests not working
            // TODO copy EPUB file to downloads dir
            // TODO plan for upgrade of results

        }
    }
    catch(err) {
        return { success: false, errors};
    }
    return {success: true, errors: []};
}

function canRemove(testBook) {

}

function remove(testBook) {
    // TODO: check if there are any answersets which use this book
        

        // if they have answers filled in (e.g. not  NOANSWER), don't allow deletion
        

        // else delete the answers, answersets, and also the testbook

}

module.exports = {
    add,
    parse,
    remove,
    canRemove
};