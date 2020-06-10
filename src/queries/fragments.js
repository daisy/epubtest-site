module.exports = {
    TESTING_ENVIRONMENT_FIELDS:`
    id
    isArchived
    testedWithBraille
    testedWithScreenreader
    input
    readingSystem {
        name
        version
        vendor
    }
    assistiveTechnology {
        name
        version
        vendor
    }
    os {
        name
        version
        vendor
    }
    device {
        name
        version
        vendor
    }
    browser {
        name
        version
        vendor
    }`,

    TEST_BOOK_FIELDS:`
    title
    version
    filename
    id
    lang {
        id
        label
    }
    topic {
        id
        order
        type
    }`,
    
    ANSWER_FIELDS: `
    id
    test {
        id
        testId
        description
        name
    }
    value
    flag
    notes
    notesArePublic`,
    
    SOFTWARE_FIELDS: `
    id
    type
    name
    version
    vendor
    active`,

    USER_FIELDS:`
    id
    name
    organization
    website
    includeCredit
    creditAs`,
    

    ANSWERSET_FIELDS:`
    id
    summary
    userId
    flag
    score
    isPublic`,

    TEST_FIELDS: `
    id
    testId
    name
    description
    xhtml`
}