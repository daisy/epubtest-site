# epubtest.org

EPUB reading experience testing: [epubtest.org](http://epubtest.org)

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

