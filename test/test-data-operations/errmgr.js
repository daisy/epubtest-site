let errors = [];

function addError(err) {
    errors.push(err);
}

function addErrors(errs) {
    for (let err of errs) {
        errors.push(err);
    }
}

function getErrors () {
    return errors;
};

export { addError, addErrors, getErrors };