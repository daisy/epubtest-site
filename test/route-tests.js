const app = require('../src/app');
const supertest = require('supertest'); 
const request = supertest(app);


describe('epubtest.org public pages', function() {
    it('Gets the homepage', async () => {
        await request
            .get('/')
            .expect(200);
    });
    it('Gets the about page', async () => {
        await request
            .get('/about')
            .expect(200);
    });
    it('Gets the participate page', async () => {
        await request
            .get('/participate')
            .expect(200);
    });
    it('Gets the results page', async () => {
        await request
            .get('/results')
            .expect(200);
    });
    it('Gets the test books page', async () => {
        await request
            .get('/test-books')
            .expect(200);
    });
    it('Gets the login page', async () => {
        await request
            .get('/login')
            .expect(200);
    });
    it('Gets the forgot password page', async () => {
        await request
            .get('/forgot-password')
            .expect(200);
    });
    it('Gets the error page', async () => {
        await request
            .get('/error')
            .expect(200);
    });    
});
