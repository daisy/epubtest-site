import initExpressApp from '../../src/app.js';
import winston from 'winston';
import * as seleniumWebdriver from 'selenium-webdriver';
const {Builder, By, Key, until} = seleniumWebdriver;

import chai from 'chai';
const expect = chai.expect;

let driver;
let siteUrl;

const waitFor = delay => new Promise(resolve => setTimeout(resolve, delay));

describe('test-user-pages', function () {
    this.timeout(10000);
    before(async function () {
        const port = process.env.PORT || 8000;
        
        // temp!!
        winston.add(new winston.transports.Console({format: winston.format.simple()}));
        winston.level = 'debug';
        let app = await initExpressApp();
        this.server = app.listen(port, () => winston.log('info', `epubtest listening on port ${port}!`))
        // -- 

        driver = await new Builder().forBrowser('firefox').build();
        siteUrl = `http://localhost:${port}`;

        // login as a user
        await driver.get(siteUrl + '/login');
        let email = await driver.findElement(By.name("email"));
        await email.sendKeys("sara@example.com");
        let password = await driver.findElement(By.name("password"));
        await password.sendKeys('password');
        let button = await driver.findElement(By.name('submit'));
        await button.click();
        // wait until the login has been processed and the page refreshes
        await driver.wait(until.elementLocated(By.xpath(`//input[@type='submit'][@value="Logout"]`)), 3000);

    });
    
    describe("test user dashboard", function() {
        it('shows the user dashboard after logging in', async function() {
            let currentUrl = await driver.getCurrentUrl();
            expect(currentUrl).to.equal(siteUrl + '/user/dashboard');
        });
        it (`has nav links to the user's testing environments`, async function() {
            let navLinks = await driver.findElements(By.css("nav.secondary-nav li a"));
            expect(navLinks.length).to.equal(2);
        });
        it (`shows the testing environment details`, async function() {
            let testenvTitles = await driver.findElements(By.css(".testing-environment-title"));
            expect(testenvTitles.length).to.equal(2);
    
            let detailsLists = await driver.findElements(By.css("main .detailslist"));
            expect(detailsLists.length).to.equal(4);
        });
        it (`shows tables with test topics, scores, and links`, async function() {
            let dataTables = await driver.executeScript(
                `return Array.from(document.querySelectorAll("data-table")).map(r => r.shadowRoot.querySelector("table"))`
            );

            for(let dataTable of dataTables) {
                let tableRows = await dataTable.findElements(By.css("tbody tr"));
                expect(tableRows.length).to.not.equal(0);
    
                let cols = await dataTable.findElements(By.css("tbody tr td:first-child"));
                for (let col of cols) {
                    let text = await col.getText();
                    expect(text).to.be.oneOf(['Basic Functionality', "Non-Visual Reading"]);
                }
    
                cols = await dataTable.findElements(By.css("tbody tr td:nth-child(2)"));
                for (let col of cols) {
                    let text = await col.getText();
                    text = parseFloat(text.replace("%", "").trim());
                    expect(text).to.be.a('number');
                }
    
                cols = await dataTable.findElements(By.css("tbody tr td:nth-child(3) a"));
                for (let col of cols) {
                    let text = await col.getText();
                    let href = await col.getAttribute("href");
                    expect(text).to.equal("Edit");
                    expect(href).to.contain(`/user/edit-results/`);
                }
    
                cols = await dataTable.findElements(By.css("tbody tr td:nth-child(4) > *"));
                for (let col of cols) {
                    let tagName = await col.getTagName();
                    if (tagName == "form") {
                        let button = await col.findElement(By.tagName("input[type=submit]"));
                        let text = await button.getAttribute("value");
                        expect(text).to.equal("Request to publish");
                        let action = await col.getAttribute("action");
                        expect(action).to.contain("/user/forms/request-to-publish");
                    }
                    else if (tagName == "a") {
                        let text = await col.getText();
                        let href = await col.getAttribute("href");
                        expect(text).to.equal("Published");
                        expect(href).to.contain(`/results/`);
                    }
                    
                }
            }
    
        });
    
    });

    describe("test user results editing", function () {
        // it("has working links for editing each set of results", async function() {
        //     await driver.get(siteUrl + "/user/dashboard");
        //     await driver.wait(until.urlIs(siteUrl + "/user/dashboard"));

        //     let col3s = await driver.executeScript(
        //         `return document.querySelector('data-table#1').shadowRoot.querySelectorAll('table tbody tr td:nth-child(3) a')`
        //     );
        //     for (let col3 of col3s) {
        //         let href = await col3.getAttribute("href");
        //         await driver.get(href);
        //         await driver.wait(until.urlIs(href), 3000);
        //     }
        // });
        it("has a correctly structured 'edit results' page", async function() {
            await driver.get(siteUrl + "/user/edit-results/5");
            await driver.wait(until.urlIs(siteUrl + "/user/edit-results/5"), 3000);
            await driver.wait(until.titleIs("Edit Results"), 3000);

            // it has the correct page heading
            let pageH2 = await driver.findElement(By.css("main > h2"));
            let pageH2Text = await pageH2.getText();
            expect(pageH2Text).to.equal("Edit Results: Basic Functionality");

            // it has a table with results data
            let dataTable = await driver.executeScript(
                "return document.querySelector('data-table').shadowRoot.querySelector('table')"
            );       
            let tableRows = await dataTable.findElements("tbody tr");
            expect(tableRows.length).to.not.equal(0);

            let testIdValues = ['file-010', 'file-020', 'file-030'];
            let testIds = await dataTable.findElements("tbody tr td:first-child");
            for (let testId of testIds) {
                let text = await testId.getText();
                expect(text).to.be.oneOf(testIdValues);
            }

            let cols = await dataTable.findElements("tbody tr td:nth-child(2)");
            for (let col of cols) {
                let text = await col.getText();
                expect(text).to.not.be.empty;
            }

            cols = await dataTable.findElements("tbody tr td:nth-child(3)");
            for (let col of cols) {
                let text = await col.getText();
                expect(text).to.not.be.empty;
            }
        });
    });

    describe("test user profile", function() {
        it("has a user profile page", async function() {
            await driver.get(siteUrl + "/user/profile");
            await driver.wait(until.urlIs(siteUrl + "/user/profile"));
            let title = await driver.getTitle();
            expect(title).to.equal("epubtest.org: Profile");
        });
    });
    
    after(async function () {
        await driver.quit();
    });

});
