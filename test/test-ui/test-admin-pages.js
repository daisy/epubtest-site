import * as seleniumWebdriver from 'selenium-webdriver';
const {Builder, By, Key, until} = seleniumWebdriver;
import {setup, teardown} from './mocha.global.fixtures.js';
import * as helpers from './helpers.js';
import chai from 'chai';
const expect = chai.expect;

let driver;
let siteUrl;
let server; // only used for VSCODE WORKAROUND

describe('test-admin-pages', function () {
    this.timeout(10000);
    before(async function () {
        const port = process.env.PORT || 8000;
        driver = await new Builder().forBrowser('firefox').build();
        siteUrl = `http://localhost:${port}`;

        if (process.env.VSCODE_WORKAROUND) {
            server = await setup();
        }
    });
    
    describe("test admin page", function() {
        before(async function() {
            await helpers.login(driver, siteUrl + "/login", "admin@example.com", "password");
            await helpers.goto(driver, siteUrl + "/admin");
        });
        it('gives access to the admin page', async function() {
            let title = await driver.getTitle();
            expect(title).to.equal("epubtest.org: Admin: Home");
        });
        it("has working links for each admin subpage", async function() {
            // collect all the links on the page before we have to navigate away from the page
            let links_ = await driver.findElements(By.css("main ul a"));
            let links = [];
            for (let l of links_) {
                let href = await l.getAttribute("href");
                links.push(href);
            }
            // check that each link results in a non-error page
            for (let link of links) {
                await helpers.goto(driver, link);
                let title = await driver.getTitle();
                expect(title).to.not.contain("Error");
                expect(title).to.not.contain("Problem");
            }
        });
    });

    describe("test manage requests page", async function() {
        before(async function() {
            // login as a user to submit a request
            await helpers.login(driver, siteUrl + "/login", "sara@example.com", "password");
            await helpers.goto(driver, siteUrl + "/user/dashboard");
            // find request to publish button and press it
            let requestToPublishButton = await driver.executeScript(
                `return document.querySelector("data-table").shadowRoot.querySelector("table tbody tr td:nth-child(4) input[name=submit]")`
            );
            if (requestToPublishButton) {
                await requestToPublishButton.click();
                await helpers.logout(driver);
            }
            
            // log back in as the admin
            await helpers.login(driver, siteUrl + "/login", "admin@example.com", "password");
            await helpers.goto(driver, siteUrl + "/admin/requests");
            
        });
        it ("has a request to publish", async function() {
            let requestRows = await driver.executeScript(
                'return document.querySelector("data-table").shadowRoot.querySelector("table tbody tr")'
            );
            expect(requestRows.length).to.not.equal(0);
        });

        after(async function() {
            // deny the request so that when this test runs again, it works
            let denyButton = await driver.executeScript(
                `return document.querySelector("data-table").shadowRoot.querySelector("table tbody tr input[name=deny]")`
            );
            await denyButton.click();
        });

    });
    describe("test manage testing environments page", async function() {
        before(async function() {
            await helpers.login(driver, siteUrl + "/login", "admin@example.com", "password");
            await helpers.goto(driver, siteUrl + "/admin/testing-environments");
        });
        it("has a non-empty table", async function() {
            // make sure there's a nonempty data table
            let tableRows = await driver.executeScript(
                "return document.querySelector('data-table').shadowRoot.querySelector('table tbody tr')"
            );
            expect(tableRows.length).to.not.equal(0);
        });
    });
    describe("test add testing environment page", async function() {
        before(async function() {
            await helpers.login(driver, siteUrl + "/login", "admin@example.com", "password");
            await helpers.goto(driver, siteUrl + "/admin/add-testing-environment");
        });
        it.skip("can add a new testing environment", async function() {

        });
    });
    describe("test add reading system page", async function() {
        before(async function() {
            await helpers.login(driver, siteUrl + "/login", "admin@example.com", "password");
            await helpers.goto(driver, siteUrl + "/admin/add-software/reading-system");
        });
        it.skip("can add a new reading system", async function() {

        });
    });
    describe("test add assistive technology page", async function() {
        before(async function() {
            await helpers.login(driver, siteUrl + "/login", "admin@example.com", "password");
            await helpers.goto(driver, siteUrl + "/admin/add-software/assistive-technology");
        });
        it.skip("can add a new assistive technology", async function() {

        });
    });
    describe("test add operating system page", async function() {
        before(async function() {
            await helpers.login(driver, siteUrl + "/login", "admin@example.com", "password");
            await helpers.goto(driver, siteUrl + "/admin/add-software/os");
        });
        it.skip("can add a new opereating system", async function() {

        });
    });
    describe("test add browser page", async function() {
        before(async function() {
            await helpers.login(driver, siteUrl + "/login", "admin@example.com", "password");
            await helpers.goto(driver, siteUrl + "/admin/add-software/browser");
        });
        it.skip("can add a new browser", async function() {

        });
    });
    describe("test add device page", async function() {
        before(async function() {
            await helpers.login(driver, siteUrl + "/login", "admin@example.com", "password");
            await helpers.goto(driver, siteUrl + "/admin/add-software/device");
        });
        it.skip("", async function() {

        });
    });
    describe("test software lists pages", async function() {
        before(async function() {
            await helpers.login(driver, siteUrl + "/login", "admin@example.com", "password");
            await helpers.goto(driver, siteUrl + "/admin");
        });
        it.skip("", async function() {

        });
    });
    describe("test manage test books page", async function() {
        before(async function() {
            await helpers.login(driver, siteUrl + "/login", "admin@example.com", "password");
            await helpers.goto(driver, siteUrl + "/admin");
        });
        it.skip("", async function() {

        });
    });
    describe("test active users page", async function() {
        before(async function() {
            await helpers.login(driver, siteUrl + "/login", "admin@example.com", "password");
            await helpers.goto(driver, siteUrl + "/admin");
        });
        it.skip("", async function() {

        });
    });
    describe("test invite user page", async function() {
        before(async function() {
            await helpers.login(driver, siteUrl + "/login", "admin@example.com", "password");
            await helpers.goto(driver, siteUrl + "/admin");
        });
        it.skip("", async function() {

        });
    });
    describe("test pending invitations page", async function() {
        before(async function() {
            await helpers.login(driver, siteUrl + "/login", "admin@example.com", "password");
            await helpers.goto(driver, siteUrl + "/admin");
        });
        it.skip("", async function() {

        });
    });

    after(async function () {
        await driver.quit();
        if (process.env.VSCODE_WORKAROUND) {
            await teardown(server);
        }
    });

});
