
'use strict';

// const DOMParser = require('xmldom-alpha').DOMParser;
// const XMLSerializer = require('xmldom-alpha').XMLSerializer;
const DOMParser = require('xmldom').DOMParser;
const XMLSerializer = require('xmldom').XMLSerializer;
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
    winston.log('info', `Processing ${fullpath}`);
    //const hash = fullpath.split('#')[1];
    const content = fs.readFileSync(filepath).toString();
    //FIXME hack to workaround xmldom-alpha regex test
    const doc = new DOMParser({errorHandler}).parseFromString(content, 'application/xhtml');
    const select = xpath.useNamespaces({html: "http://www.w3.org/1999/xhtml", epub: "http://www.idpf.org/2007/ops"});
    const testId = select(`//*[@id="${hash}"]//*[@class="test-id"]/text()`, doc)[0].textContent;
    const testTitle = select(`//*[@id="${hash}"]//*[@class="test-title"]`, doc)[0].textContent;
    let testDesc = select(`//*[@id="${hash}"]//*[@class="desc"]`, doc)[0].textContent;
    const section = select(`//*[@id="${hash}"]`, doc);
    const sectionHtml = new XMLSerializer().serializeToString(section[0]);
    
    return {
      id: testId.trim(),
      name: testTitle.trim(),
      description: testDesc.replace(/<[^>]*>/gi, '').trim(),
      xhtml: sectionHtml,
      ingested: Date.now()
    };
  }
}
