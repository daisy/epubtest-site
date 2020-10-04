#!/bin/bash
if [ -z "$EPUBCHECK" ]
  then
    echo "Please set EPUBCHECK to the location of epubcheck.jar on your machine"
    exit 1
fi

java -jar ${EPUBCHECK} --mode exp --save testbook-example-basic-func-1.0.0-en
wait
java -jar ${EPUBCHECK} --mode exp --save testbook-example-basic-func-1.1.0-en
wait
java -jar ${EPUBCHECK} --mode exp --save testbook-example-non-visual-reading-1.0.0-en
wait
java -jar ${EPUBCHECK} --mode exp --save testbook-example-non-visual-reading-1.0.1-en
wait
java -jar ${EPUBCHECK} --mode exp --save testbook-example-invalid-version
