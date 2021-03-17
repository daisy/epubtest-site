import * as seleniumWebdriver from 'selenium-webdriver';
const { By, until } = seleniumWebdriver;

// return success
async function login(driver, url, email, password) {
    await logout(driver);

    // login
    await goto(driver, url);
    let emailField = await driver.findElement(By.name("email"));
    await emailField.sendKeys(email);
    let passwordField = await driver.findElement(By.name("password"));
    await passwordField.sendKeys(password);
    let button = await driver.findElement(By.name('submit'));
    await button.click();

    // wait until the login has been processed and the page refreshes
    try {
        await driver.wait(until.elementLocated(By.xpath(`//input[@type='submit'][@value="Logout"]`)), 3000);
        return true;
    }
    catch (err) {
        return false;
    }
}

async function logout(driver) {
    try {
        let logoutButton = await driver.findElement(By.xpath(`//input[@type='submit'][@value="Logout"]`));
        if (logoutButton) {
            await logoutButton.click();
            await driver.wait(until.titleIs("epubtest.org"), 3000);
        }
    }
    catch(err) {
        // do nothing
    }
}

async function goto(driver, url) {
    await driver.get(url);
    try {
        await driver.wait(until.urlIs(url), 3000);
        return true;
    }
    catch(err) {
        return false;
    }
}

// contextObj could be the webdriver or a webelement
async function selectOption(contextObj, cssSelector, optionName) {
    let selectElm = await contextObj.findElement(By.css(cssSelector));
    let option = selectElm.findElement(By.css(`[name=${optionName}`));
    await option.setAttribute("selected", "selected");
}

async function enterText(contextObj, cssSelector, text) {
    let textField = await contextObj.findElement(By.css(cssSelector));
    await textField.sendKeys(text);
}

async function clickElement(contextObj, cssSelector) {
    let elm = await contextObj.findElement(By.css(cssSelector));
    await elm.click();
}

async function getText(driver, cssSelector) {
    let elm = await driver.findElement(By.css(cssSelector));
    let text = await elm.getText();
    return text;
}
export { login, logout, goto, selectOption, enterText, clickElement, getText }