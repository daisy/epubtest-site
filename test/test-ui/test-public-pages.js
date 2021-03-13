import * as seleniumWebdriver from 'selenium-webdriver';
const {Builder, By, Key, until} = seleniumWebdriver;

import initExpressApp from '../../src/app.js';
import winston from 'winston';

import chai from 'chai';
const expect = chai.expect;

let driver;
let siteUrl;
let server;

describe('test-public-pages', function () {
    this.timeout(100000);
    before(async function () {
        winston.add(new winston.transports.Console({format: winston.format.simple()}));
        winston.level = 'debug';
        const port = process.env.PORT || 8000;
        let app = await initExpressApp();
        server = app.listen(port, () => winston.log('info', `epubtest listening on port ${port}!`))
        driver = await new Builder().forBrowser('firefox').build();
        siteUrl = `http://localhost:${port}`;
    });
    it('has a homepage', async function() {
        await driver.get(siteUrl);
        let title = await driver.getTitle();
        expect(title).to.equal('epubtest.org');
    });
    it('has a results page', async function() {
        await driver.get(siteUrl + '/results');
        let title = await driver.getTitle();
        expect(title).to.equal('epubtest.org: Results');        
    });
    it('has a test books page', async function() {
        await driver.get(siteUrl + '/test-books');
        let title = await driver.getTitle();
        expect(title).to.equal('epubtest.org: Test Books');
    });
    it('has a participate page', async function() {
        await driver.get(siteUrl + "/participate");
        let title = await driver.getTitle();
        expect(title).to.equal('epubtest.org: Participate');
    });
    it('has an about page', async function() {
        await driver.get(siteUrl + "/about");
        let title = await driver.getTitle();
        expect(title).to.equal('epubtest.org: About');
    });
    it('has a login page', async function() {
        await driver.get(siteUrl + "/login");
        let title = await driver.getTitle();
        expect(title).to.equal('epubtest.org: Login');
    });
    it('has a forgot password page', async function() {
        await driver.get(siteUrl + "/forgot-password");
        let title = await driver.getTitle();
        expect(title).to.equal('epubtest.org: Forgot password');
    });
    it('has a results page with rows of data', async function () {
        await driver.get(siteUrl + '/results');
        let tableRows = await driver.executeScript(
            "return document.querySelector('data-table').shadowRoot.querySelectorAll('table tbody tr')"
        );       
        expect(tableRows.length).to.not.equal(0);
    });
    it('has a test books page with rows of data and download links', async function() {
        // 1. are there table rows?
        await driver.get(siteUrl + '/test-books');
        let tableRows = await driver.executeScript(
            "return document.querySelector('data-table').shadowRoot.querySelectorAll('table tbody tr')"
        );       
        expect(tableRows.length).to.not.equal(0);

        // 2. are there download links?
        let downloadLinks = await driver.executeScript(
            "return document.querySelector('data-table').shadowRoot.querySelectorAll('table tbody tr td:last-child a')"
        );       
        for(let link of downloadLinks) {
            let text = await link.getText();
            expect(text).to.equal("Download");
        }
    });
    it('can reset passwords', async function() {
        // 1. test by entering a valid email
        await driver.get(siteUrl + '/forgot-password');
        let input = await driver.findElement(By.name("email"));
        await input.sendKeys("sara@example.com");
        let button = await driver.findElement(By.name('submit'));
        await button.click();
        
        await driver.wait(until.elementLocated(By.className('message')), 30000);
        let message = await driver.findElement(By.className('message'));
        let messageText = await message.getText();
        expect(messageText).to.contain("Password reset initiated");

        // 2. test by entering an invalid email
        await driver.get(siteUrl + '/forgot-password');
        input = await driver.findElement(By.name("email"));
        await input.sendKeys("invalid@example.com");
        button = await driver.findElement(By.name('submit'));
        await button.click();
        
        await driver.wait(until.elementLocated(By.className('message')), 30000);
        message = await driver.findElement(By.className('message'));
        messageText = await message.getText();
        expect(messageText).to.contain("Reset password error");

    });
    
    it('rejects an invalid login', async function() {
        await driver.get(siteUrl + '/login');
        let email = await driver.findElement(By.name("email"));
        await email.sendKeys("invalid@example.com");
        let password = await driver.findElement(By.name("password"));
        await password.sendKeys('password');
        let button = await driver.findElement(By.name('submit'));
        await button.click();
        
        // wait for error message
        await driver.wait(until.elementLocated(By.className('message')), 30000);
        let message = await driver.findElement(By.className('message'));
        let messageText = await message.getText();
        expect(messageText).to.contain("Login error");
    });

    it('accepts a valid login', async function() {
        await driver.get(siteUrl + '/login');
        let email = await driver.findElement(By.name("email"));
        await email.sendKeys("sara@example.com");
        let password = await driver.findElement(By.name("password"));
        await password.sendKeys('password');
        let button = await driver.findElement(By.name('submit'));
        await button.click();

        // wait for logout button
        await driver.wait(until.elementLocated(By.xpath(`//input[@type='submit'][@value="Logout"]`)), 30000);
        button = await driver.findElement(By.name('submit'));
        let buttonText = await button.getAttribute('value');
        expect(buttonText).to.contain("Logout");
        await button.click();

    });
    after(async function () {
        await driver.quit();
        await server.close();
    });

});

