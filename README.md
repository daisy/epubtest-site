# epubtest.org

EPUB reading experience testing: [epubtest.org](https://epubtest.org)

# Tech notes

Back end: Express + nunjucks + graphql queries

Front end: static HTML + web component enhanced tables

Back end's back end: Postgresql database and a postgraphile db api (graphql)

# Code notes

## `src`

### `actions`

Multipart processes, such as:

* adding/removing testing environments
* ingesting test books
* adding/removing answer sets
* sending email
* an experimental "undo" feature to mimic transactions

### `epub-parser`

Parse a test book into a JSON structure

### `l10n`

Experimental

### `pages`

Entire front-end

* `books`: test books available for download
* `css`: stylesheets
* `images`
* `js`: front-end js, mostly data table stuff
* `templates`: nunjucks templates

### `queries`

GraphQL queries. Some comments:

* `queries/fragments` contains fields that are collected for each item type. Sometimes there are variants of fieldsets, perhaps to avoid collecting way more data than is required, or sometimes to avoid circular includes.
* `queries/crudGenerator.js` generates basic CRUD operation queries, given a few parameters

### `routes`

* `admin.js`: GET admin pages
* `admin-forms.js`: POST routes for admin forms
* `public.js`: GET public pages
* `public-forms.js`: POST routes for public forms (login, forgot password)
* `user.js`: GET user pages. Note that some (set password, accept invitation) are restricted by token and will not display unless the token in the query string is correct.
* `user-forms.js`: POST routes for user forms

### Other files

* `database.js`: sends a query to the database api server
* `emails.js`: Text for emails that get sent to useres
* `middleware.js`: Various custom middleware
* `utils.js`: Various utility functions
* `displayUtils.js`: Largely redundant display utilities which are often duplicates of front-end js table logic. Used here for creating static noscript tables.

## `test`

Workflow tests; run with mocha.

## Caveats, other notes, etc

### Postgraphile and column-level grant

Postgraphile does not support column-level grants, which is why there is a separate logins vs users table. Otherwise the login information would be theoretically visible to anyone who could view the user information (which, some of it could be viewable, for example, if the user has chosen to get credited for their work, then the results page must display their `creditAs` value, so their credits must be publicly accessible).

Since we are controlling database access via the server, no outside querying is allowed, and the pages are tightly controlled. To be forward-thinking, however, the database API was setup with the possibility to one day have more client-side querying supported, therefore security tokens, row level security, and design decisions such as what's described above are in place.

Note that one exception to this lies with the use of "private link" tokens. The server (express layer) verifies specific resource access permissions; the database layer gives blanket (table(s)-wide) read-only permission. If we ever created a public database endpoint, we would have to keep this in mind. 

Another exception is the "create temporary token" function, which is right now only called by the server but again, if we ever created a public database endpoint, access to this this should be restricted.

### Authentication

Token-based authentication

* Login: Token lasts for 7 days
* Invite to create account: Token lasts for 7 days
* Forgot password: Token lasts for 4 hours
* private link: good for 10 years or until manually invalidated

