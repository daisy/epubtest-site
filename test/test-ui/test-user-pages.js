import initExpressApp from '../../src/app.js';
import winston from 'winston';
import * as seleniumWebdriver from 'selenium-webdriver';
const {Builder, By, Key, until} = seleniumWebdriver;
import {setup, teardown} from './mocha.global.fixtures.js';

import chai from 'chai';
const expect = chai.expect;

let driver;
let siteUrl;
let server; // only used for VSCODE WORKAROUND

const waitFor = delay => new Promise(resolve => setTimeout(resolve, delay));

describe('test-user-pages', function () {
    this.timeout(10000);
    before(async function () {
        const port = process.env.PORT || 8000;
        driver = await new Builder().forBrowser('firefox').build();
        siteUrl = `http://localhost:${port}`;

        if (process.env.VSCODE_WORKAROUND) {
            server = await setup();
        }

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
        it("has working links for editing each set of results", async function() {
            await driver.get(siteUrl + "/user/dashboard");
            await driver.wait(until.urlIs(siteUrl + "/user/dashboard"));

            let dataTables = await driver.executeScript(
                `return Array.from(document.querySelectorAll("data-table")).map(r => r.shadowRoot.querySelector("table"))`
            );

            // collect all the links on the page before we have to navigate away from the page
            let links = [];
            for (let dataTable of dataTables) {
                let links_ = await dataTable.findElements(By.css("tbody tr td:nth-child(3) a"));
                for (let l of links_) {
                    let href = await l.getAttribute("href");
                    links.push(href);
                }
            }
            // check that each link results in a results editing page
            for (let link of links) {
                await driver.get(link);
                await driver.wait(until.urlIs(link), 3000);
                let title = await driver.getTitle();
                expect(title).to.equal("epubtest.org: Edit Results");
            }
        });
        it("has a correctly structured 'edit results' page", async function() {
            // grab the first edit link from the dashboard
            await driver.get(siteUrl + "/user/dashboard");
            await driver.wait(until.urlIs(siteUrl + "/user/dashboard"));
            let link = await driver.executeScript(
                `return document.querySelector("data-table").shadowRoot.querySelector("table tbody tr td:nth-child(3) a")`
            );
            let href = await link.getAttribute("href");
            
            // go to the results page at that link
            await driver.get(href);
            await driver.wait(until.urlIs(href), 3000);

            // it has the correct page heading
            let pageH2 = await driver.findElement(By.css("main > h2"));
            let pageH2Text = await pageH2.getText();
            expect(pageH2Text).to.equal("Edit Results: Basic Functionality");

            // it has a table with results data
            let dataTable = await driver.findElement(By.css("table"));
            let tableRows = await dataTable.findElements(By.css("tbody tr"));
            expect(tableRows.length).to.not.equal(0);

            // it has the right test IDs
            let testIdValues = ['file-010', 'file-110', 'file-210'];
            let testIds = await dataTable.findElements(By.css("tbody tr td:first-child"));
            for (let testId of testIds) {
                let text = await testId.getText();
                expect(text).to.be.oneOf(testIdValues);
            }

            // it has not empty text
            let cols = await dataTable.findElements(By.css("tbody tr td:nth-child(2)"));
            for (let col of cols) {
                let text = await col.getText();
                expect(text).to.not.be.empty;
            }

            // it has not empty text (again)
            cols = await dataTable.findElements(By.css("tbody tr td:nth-child(3)"));
            for (let col of cols) {
                let text = await col.getText();
                expect(text).to.not.be.empty;
            }

            cols = await dataTable.findElements(By.css("tbody tr td:nth-child(4)"));
            for (let col of cols) {
                let options = await col.findElements(By.css("option"));
                for (let option of options) {
                    let value = await option.getAttribute("value");
                    let text = await option.getText();

                    expect(value).to.be.oneOf(['PASS', 'FAIL', 'NA', 'NOANSWER']);

                    if (value == "PASS") {
                        expect(text).to.equal("Pass");
                    }
                    else if (value == "FAIL") {
                        expect(text).to.equal("Fail");
                    }
                    else if (value == "NA") {
                        expect(text).to.equal("Not applicable");
                    }
                    else { // value == "NOANSWER"
                        expect(text).to.equal("No answer");
                    } 
                }
            }

            cols = await dataTable.findElements(By.css("tbody tr td:nth-child(5)"));
            for(let col of cols) {
                let children = await col.findElements(By.css("*"));
                for (let child of children) {
                    let tagName = await child.getTagName();
                    expect(tagName).to.be.oneOf(["textarea", "input"]);
                }
                expect(children.length).to.equal(2);
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
        if (process.env.VSCODE_WORKAROUND) {
            await teardown(server);
        }
    });

});
