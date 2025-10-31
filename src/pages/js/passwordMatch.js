function initCheckPasswordsMatch(formId) {
    let form = document.getElementById(formId);

    form.addEventListener("submit", event => {
        let password1 = form.elements.password.value;
        let password2 = form.elements.passwordmatch.value;

        if (password1 != password2) {
            event.preventDefault();
            let elm = document.getElementById("local-error");
            elm.textContent = "Passwords must match!";
        }
        else {
            this.submit();
        }
    }, false);
}

export {initCheckPasswordsMatch};