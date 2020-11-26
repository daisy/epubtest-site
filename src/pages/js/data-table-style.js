const style = `
table a {
    display: block;
    padding-bottom: 1vh;
    color: var(--primary);
}
table tr span.sw {
    display: block;
}
tr a.score {
    color: inherit;
}
.not-tested {
    font-weight: lighter;
    font-style: italic;
}
.readingSystem {
    font-size: larger;
}
.sw:not(.readingSystem) {
    padding-left: 0.5rem;
}
span.pass, span.fail {
    white-space: nowrap;
}
/* specific to the test results tables */
div.test-results th:first-of-type, div.test-results td:first-of-type {
    width: 5rem;
}
div.test-results th:nth-of-type(4), div.test-results td:nth-of-type(4) {
    width: min-content;
    padding-right: 4rem;
    padding-left: 4rem;
}
div.test-results {
    width: 100%;
}
@media(max-width: 768px) {
    .filters div {
        grid-template-columns: 40% 60% !important;
    }
}
`;

export { style };