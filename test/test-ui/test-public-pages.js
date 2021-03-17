import * as seleniumWebdriver from 'selenium-webdriver';
const {Builder, By, Key, until} = seleniumWebdriver;
import {setup, teardown} from './mocha.global.fixtures.js';
import chai from 'chai';
const expect = chai.expect;
import * as helpers from './helpers.js';

let driver;
let siteUrl;
let server; // only used for VSCODE WORKAROUND

describe('test-public-pages', function () {
    this.timeout(100000);
    before(async function () {
         const port = process.env.PORT || 8000;
         driver = await new Builder().forBrowser('firefox').build();
         siteUrl = `http://localhost:${port}`;

         if (process.env.VSCODE_WORKAROUND) {
             server = await setup();
         }

    });
    it('has a homepage', async function() {
        await helpers.goto(driver, siteUrl);
        let title = await driver.getTitle();
        expect(title).to.equal('epubtest.org');
    });
    it('has a results page', async function() {
        await helpers.goto(driver, siteUrl + "/results");
        let title = await driver.getTitle();
        expect(title).to.equal('epubtest.org: Results');        
    });
    it('has a test books page', async function() {
        await helpers.goto(driver, siteUrl + '/test-books');
        let title = await driver.getTitle();
        expect(title).to.equal('epubtest.org: Test Books');
    });
    it('has a participate page', async function() {
        await helpers.goto(driver, siteUrl + "/participate");
        let title = await driver.getTitle();
        expect(title).to.equal('epubtest.org: Participate');
    });
    it('has an about page', async function() {
        await helpers.goto(driver, siteUrl + "/about");
        let title = await driver.getTitle();
        expect(title).to.equal('epubtest.org: About');
    });
    it('has a login page', async function() {
        await helpers.goto(driver, siteUrl + "/login");
        let title = await driver.getTitle();
        expect(title).to.equal('epubtest.org: Login');
    });
    it('has a forgot password page', async function() {
        await helpers.goto(driver, siteUrl + "/forgot-password");
        let title = await driver.getTitle();
        expect(title).to.equal('epubtest.org: Forgot password');
    });
    it('has a results page with rows of data', async function () {
        await helpers.goto(driver, siteUrl + '/results');
        let dataTable = await driver.executeScript(
            "return document.querySelector('data-table').shadowRoot.querySelector('table')"
        );       
        let tableRows = await dataTable.findElements(By.css("tbody tr"));
        expect(tableRows.length).to.not.equal(0);
    });
    it('has a test books page with rows of data and download links', async function() {
        // 1. are there table rows?
        await helpers.goto(driver, siteUrl + '/test-books');
        let dataTable = await driver.executeScript(
            "return document.querySelector('data-table').shadowRoot.querySelector('table')"
        );       
        let tableRows = await dataTable.findElements(By.css("tbody tr"));
        expect(tableRows.length).to.not.equal(0);

        // 2. are there download links?
        let downloadLinks = await dataTable.findElements(By.css("tbody tr td:last-child a"));
        for(let link of downloadLinks) {
            let text = await link.getText();
            expect(text).to.equal("Download");
        }
    });
    it('can reset passwords', async function() {
        // 1. test by entering a valid email
        await helpers.goto(driver, siteUrl + '/forgot-password');
        await helpers.enterText(driver, "[name=email]", "sara@example.com");
        await helpers.clickElement(driver, "[name=submit]");
        
        await driver.wait(until.elementLocated(By.css('.message')), 3000);
        let messageText = await helpers.getText(driver, ".message");
        expect(messageText).to.contain("Password reset initiated");

        // 2. test by entering an invalid email
        await helpers.goto(driver, siteUrl + '/forgot-password');
        await helpers.enterText(driver, "[name=email]", "invalid@example.com");
        await helpers.clickElement(driver, "[name=submit]");
        
        await driver.wait(until.elementLocated(By.css('.message')), 3000);
        messageText = await helpers.getText(driver, ".message");
        expect(messageText).to.contain("Reset password error");
    });
    
    it('rejects an invalid login', async function() {
        let success = await helpers.login(driver, siteUrl + "/login", "invalid@example.com", "password");
        expect(success).to.be.false;
        
        let messageText = await helpers.getText(driver, ".message");
        expect(messageText).to.contain("Login error");
    });

    it('accepts a valid login', async function() {
        let success = await helpers.login(driver, siteUrl + "/login", "sara@example.com", "password");
        expect(success).to.be.true;

        // then logout for good measure
        await helpers.logout(driver);

    });
    after(async function () {
        await driver.quit();
        if (process.env.VSCODE_WORKAROUND) {
            await teardown(server);
        }
    });

});

