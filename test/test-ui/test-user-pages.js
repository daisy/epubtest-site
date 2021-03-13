import * as seleniumWebdriver from 'selenium-webdriver';
const {Builder, By, Key, until} = seleniumWebdriver;

import initExpressApp from '../../src/app.js';
import winston from 'winston';

import chai from 'chai';
const expect = chai.expect;

let driver;
let siteUrl;
let server;

const waitFor = delay => new Promise(resolve => setTimeout(resolve, delay));


describe('test-user-pages', function () {
    this.timeout(100000);
    before(async function () {
        console.log("Before");
        winston.add(new winston.transports.Console({format: winston.format.simple()}));
        winston.level = 'debug';
        const port = process.env.PORT || 8000;
        let app = await initExpressApp();
        server = app.listen(port, () => winston.log('info', `epubtest listening on port ${port}!`))
        driver = await new Builder().forBrowser('firefox').build();
        siteUrl = `http://localhost:${port}`;

        await waitFor(1500);

        
    });
    
    it('shows the user dashboard after logging in', async function() {
        // login as a user
        await driver.get(siteUrl + '/login');
        let email = await driver.findElement(By.name("email"));
        await email.sendKeys("sara@example.com");
        let password = await driver.findElement(By.name("password"));
        await password.sendKeys('password');
        let button = await driver.findElement(By.name('submit'));
        await button.click();
        // wait until the login has been processed and the page refreshes
        await driver.wait(until.elementLocated(By.xpath(`//input[@type='submit'][@value="Logout"]`)), 30000);

        let currentUrl = await driver.getCurrentUrl();
        expect(currentUrl).to.equal(siteUrl + '/user/dashboard');
        


    });
    after(async function () {
        await driver.quit();
        await server.close();
    });

});

