import { EPUB } from './epub-parser/epub.js';
import fs from 'fs-extra';
import * as path from 'path';
import { Command } from 'commander';
import semver from 'semver';

async function main() {
    let program = new Command();
    program
        .description('Generate parsed data for an EPUB testbook')
        .argument('input', 'EPUB file')
        .argument('output', 'Output directory')
        .action(async (inputEpub, outputDir) => {
            try {
                let testBook = await parseEpub(inputEpub, outputDir);
                let outputFile = path.join(outputDir, testBook.epubId + '.json');
                await fs.writeFile(outputFile, JSON.stringify(testBook, null, '  '));
                console.log("Wrote", outputFile);
            }
            catch(err) {
                console.log(err);
            }
            console.log("Success");

        });
    program.parse();
}

async function parseEpub(inputEpub) {
    console.log("Parsing input file", inputEpub);
    let epubOrigFilename = path.basename(inputEpub);
    try {
        let testBook;
        try {
            fs.statSync(inputEpub);
        }
        catch(err) {
            throw err;
        }
    
        let epub = new EPUB(inputEpub);
        if (!epub) {
            throw new Error(`Could not initialize EPUB.`);
        }
        let epubx = await epub.extract();
        if (!epubx) {
            throw new Error(`Could not extract EPUB.`);
        }
        let bookdata = await epubx.parse();
        if (!bookdata) {
            throw new Error(`Could not parse EPUB`);
        }
        if (!bookdata.hasOwnProperty('metadata')
            || !bookdata.hasOwnProperty("navDoc") 
            || !bookdata.navDoc.hasOwnProperty("testsData")) {
            throw new Error(`Incorrect EPUB structure for test book ingestion.`);
        }

        if (!semver.valid(bookdata.metadata['schema:version'])) {
            throw new Error(`Incorrect EPUB version metadata ${bookdata.metadata['schema:version']}; cannot ingest.`);
        }
        
        testBook = {
            title: bookdata.metadata['dc:title'],
            topicId: bookdata.metadata['dc:subject'],
            description: bookdata.metadata['dc:description'],
            langId: bookdata.metadata['dc:language'],
            epubId: bookdata.uid,
            version: bookdata.metadata['schema:version'],
            filename: epubOrigFilename,
            path: inputEpub,
            tests: bookdata.navDoc.testsData.map((t, idx)=>({
                testId: t.id,
                xhtml: t.xhtml,
                order: idx,
                flagChanged: false,
                flagNew: false,
                name: t.name,
                description: t.description
            })),
        };

        return testBook;
    }
    catch(err) {
        throw err;
    }
}

(async() => main())();
