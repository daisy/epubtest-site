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
    this.timeout(100000);
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
            let success = await helpers.login(driver, siteUrl + "/login", "sara@example.com", "password");
            expect(success).to.be.true;
            await helpers.goto(driver, siteUrl + "/user/dashboard");
            await driver.wait(until.elementLocated(By.css("data-table")));
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
        it("has data", async function() {
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
    // all the add-* pages are from the same template so we don't have to test each one separately
    describe("test add reading system page", async function() {
        before(async function() {
            await helpers.login(driver, siteUrl + "/login", "admin@example.com", "password");
            await helpers.goto(driver, siteUrl + "/admin/add-software/reading-system");
        });
        it("can add a new reading system", async function() {
            await helpers.enterText(driver, "input[name=name]", "Test-RS");
            await helpers.enterText(driver, "input[name=version]", "123.4");
            await helpers.enterText(driver, "input[name=vendor]", "TestUiCo");
            await helpers.clickElement(driver, "input[name=save]");

            await driver.wait(until.urlContains("/admin/add-testing-environment"));
            let text = await helpers.getText(driver, ".message");
            expect(text).to.contain("Created");
        });
    });
    
    describe("test reading systems list page", async function() {
        before(async function() {
            await helpers.login(driver, siteUrl + "/login", "admin@example.com", "password");
            await helpers.goto(driver, siteUrl + "/admin/all-software/assistive-technology");
        });
        it("has data", async function() {
            // make sure there's a nonempty data table
            let tableRows = await driver.executeScript(
                "return document.querySelector('data-table').shadowRoot.querySelector('table tbody tr')"
            );
            expect(tableRows.length).to.not.equal(0);
        });
    });
    describe("test assistive technologies list page", async function() {
        before(async function() {
            await helpers.login(driver, siteUrl + "/login", "admin@example.com", "password");
            await helpers.goto(driver, siteUrl + "/admin/all-software/reading-system");
        });
        it("has data", async function() {
            // make sure there's a nonempty data table
            let tableRows = await driver.executeScript(
                "return document.querySelector('data-table').shadowRoot.querySelector('table tbody tr')"
            );
            expect(tableRows.length).to.not.equal(0);
        });
    });
    describe("test operating systems list page", async function() {
        before(async function() {
            await helpers.login(driver, siteUrl + "/login", "admin@example.com", "password");
            await helpers.goto(driver, siteUrl + "/admin/all-software/os");
        });
        it("has data", async function() {
            // make sure there's a nonempty data table
            let tableRows = await driver.executeScript(
                "return document.querySelector('data-table').shadowRoot.querySelector('table tbody tr')"
            );
            expect(tableRows.length).to.not.equal(0);
        });
    });
    describe("test browser list page", async function() {
        before(async function() {
            await helpers.login(driver, siteUrl + "/login", "admin@example.com", "password");
            await helpers.goto(driver, siteUrl + "/admin/all-software/browser");
        });
        it("has data", async function() {
            // make sure there's a nonempty data table
            let tableRows = await driver.executeScript(
                "return document.querySelector('data-table').shadowRoot.querySelector('table tbody tr')"
            );
            expect(tableRows.length).to.not.equal(0);
        });
    });
    describe("test device list page", async function() {
        before(async function() {
            await helpers.login(driver, siteUrl + "/login", "admin@example.com", "password");
            await helpers.goto(driver, siteUrl + "/admin/all-software/device");
        });
        it("has data", async function() {
            // make sure there's a nonempty data table
            let tableRows = await driver.executeScript(
                "return document.querySelector('data-table').shadowRoot.querySelector('table tbody tr')"
            );
            expect(tableRows.length).to.not.equal(0);
        });
    });
    describe("test manage test books page", async function() {
        before(async function() {
            await helpers.login(driver, siteUrl + "/login", "admin@example.com", "password");
            await helpers.goto(driver, siteUrl + "/admin/test-books");
        });
        it("has data", async function() {
            // make sure there's a nonempty data table
            let tableRows = await driver.executeScript(
                "return document.querySelector('data-table').shadowRoot.querySelector('table tbody tr')"
            );
            expect(tableRows.length).to.not.equal(0);
        });
    });
    describe("test active users page", async function() {
        before(async function() {
            await helpers.login(driver, siteUrl + "/login", "admin@example.com", "password");
            await helpers.goto(driver, siteUrl + "/admin/users");
        });
        it("has data", async function() {
            // make sure there's a nonempty data table
            let tableRows = await driver.executeScript(
                "return document.querySelector('data-table').shadowRoot.querySelector('table tbody tr')"
            );
            expect(tableRows.length).to.not.equal(0);
        });
    });
    describe("test invite user page", async function() {
        before(async function() {
            await helpers.login(driver, siteUrl + "/login", "admin@example.com", "password");
            await helpers.goto(driver, siteUrl + "/admin/add-user");
        });
        it("can invite a new user", async function() {
            await helpers.enterText(driver, "input[name=name]", "Test User");
            await helpers.enterText(driver, "input[name=email]", "invite@example.com");
            await helpers.clickElement(driver, "input[type=submit]");
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
