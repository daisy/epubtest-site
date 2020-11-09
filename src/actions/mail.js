const nodemailer = require("nodemailer");

async function testEmail(emailAddress) {
    try {
        await sendEmail(
            emailAddress, 
            "Test message from epubtest.org",
            "This is a test message from epubtest.org. ",
            "<p>This is a test message from epubtest.org. </p>"
        );
        console.log("Message sent");
        return true;
    }
    catch(err) {
        console.log("Error sending test email", err);
        return false;
    };
}

async function sendEmail(toAddress, subject, messageBodyText, messageBodyHtml) {
    // can test locally with nodemailer server on port 1025
    let opts = process.env.NODE_ENV != 'production' ? 
        {
            host: 'localhost',
            port: 1025,
            secure: false, 
            tls: {
                rejectUnauthorized: false
            }
        } 
        : 
        {
            host: process.env.MAILHOST,
            port: process.env.MAILPORT,
            secure: false, 
            auth: {
                user: process.env.MAILUSER,
                pass: process.env.MAILPASS
            }
        };
    
    let transport = nodemailer.createTransport(opts);
    try {
        await transport.sendMail({
            from: '"epubtest.org" <epubtest@daisy.org>',
            to: toAddress,
            subject: subject,
            text: messageBodyText,
            html: messageBodyHtml
        }); 
    }
    catch (err) {
        return false;
    } 
    return true;
}

module.exports = {
    sendEmail,
    testEmail
};

