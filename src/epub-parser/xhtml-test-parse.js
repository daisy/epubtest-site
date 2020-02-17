
'use strict';

const DOMParser = require('xmldom-alpha').DOMParser;
const XMLSerializer = require('xmldom-alpha').XMLSerializer;
const fs = require('fs');
const path = require('path');
const xpath = require('xpath');
const winston = require('winston');

// Error Handler for DOMParser instances
const errorHandler = {
  warning: w => winston.warn(w),
  error: e => winston.warn(e),
  fatalError: fe => winston.error(fe),
}

module.exports = {
  // extract data for a test from an xhtml document
  getTestData: function (fullpath) {
    const [filepath, hash] = fullpath.split("#");
    console.log(`Processing ${fullpath}`);
    //const hash = fullpath.split('#')[1];
    const content = fs.readFileSync(filepath).toString();
    //FIXME hack to workaround xmldom-alpha regex test
    const doc = new DOMParser({errorHandler}).parseFromString(content, 'application/xhtml');
    const select = xpath.useNamespaces({html: "http://www.w3.org/1999/xhtml", epub: "http://www.idpf.org/2007/ops"});
    const testId = select(`//*[@id="${hash}"]//*[@class="test-id"]/text()`, doc);
    const testTitle = select(`//*[@id="${hash}"]//*[@class="test-title"]/text()`, doc);
    let testDesc = select(`//*[@id="${hash}"]//*[@class="desc"]`, doc);
    const section = select(`//*[@id="${hash}"]`, doc);
    const sectionHtml = new XMLSerializer().serializeToString(section[0]);

    return {
      id: testId[0].toString(),
      name: testTitle[0].toString(),
      description: testDesc[0].toString().replace(/<[^>]*>/gi, '').trim(),
      xhtml: sectionHtml,
      ingested: Date.now()
    };
  }
}