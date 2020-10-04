kill `cat test/api.pid`
rm test/api.pid
cd ../epubtest-db/setup-testdb && ./run-to-init-testdb.sh
wait
cd ../../epubtest-db-api && npm run makeCache -- ../epubtest-site/test/.dbenv
wait
npm run startApi -- ../epubtest-site/test/.dbenv &
cd ../epubtest-site/test
echo $! > api.pid