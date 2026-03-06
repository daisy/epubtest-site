# What
This standalone script parses an EPUB testbook and prepares the data for ingestion.

# How

```
cd parse-epub
npm run parse-epub book.epub ../parsed-books
```

This will create a JSON file in the output directory named after the input file. 

# TODO

- a way to flag new/changed tests e.g. `npm run parse-epub book.epub new:file-400 changed:nav-530`
- what else is happening that the server runs out of memory? is it the creation of all the related records in the database?