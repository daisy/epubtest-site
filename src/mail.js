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
    }
    catch(err) {
        console.log("Error sending test email", err);
    };
}

async function emailInvitation(userEmail, link) {
    await sendEmail(
        userEmail,
        "Invitation to contribute to epubtest.org",
        plainTextInviteMessage(link),
        htmlInviteMessage(link)
    );
    console.log("Message sent");
}

async function emailPasswordReset(userEmail, link) {
    await sendEmail(
        userEmail, 
        "Password reset requested for epubtest.org",
        plainTextResetMessage(link),
        htmlResetMessage(link)
    );
    console.log("Message sent");
}

async function sendEmail(toAddress, subject, messageBodyText, messageBodyHtml) {
    // can test locally with nodemailer server on port 1025
    let opts = process.env.MODE === 'LOCALDEV' ? 
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
    let info = await transport.sendMail({
        from: '"epubtest.org" <epubtest@daisy.org>',
        to: toAddress,
        subject: subject,
        text: messageBodyText,
        html: messageBodyHtml
    });    
}

module.exports = {
    emailInvitation,
    emailPasswordReset,
    testEmail
};

const plainTextInviteMessage = (linkTokenUrl) => `
Greetings!

This is a message from the DAISY Consortium, to invite you to participate in
Reading System Accessibility Testing at epubtest.org.

To accept this invitation, paste this link into your browser:
${linkTokenUrl}.

Don't hesitate to contact us at epubtest@daisy.org with any questions.

Thanks,

The DAISY Consortium
daisy.org
epubtest.org
inclusivepublishing.org
`;

const htmlInviteMessage = (linkTokenUrl) => `
<p>Greetings!</p>

<p>This is a message from the <a href="http://daisy.org">DAISY Consortium</a>, to invite you to participate in
Reading System Accessibility Testing at <a href="http://epubtest.org">epubtest.org</a>.

<p><a href="${linkTokenUrl}">Accept this invitation</a></p>

<p>Don't hesitate to <a href="mailto:epubtest@daisy.org">contact us</a> with any questions.</p>

<p>Thanks,
<br/>
<span>The DAISY Consortium</span>
<br/>
<a href="http://daisy.org">daisy.org</a>
<br/>
<a href="http://epubtest.org">epubtest.org</a>
<br/>
<a href="http://inclusivepublishing.org">inclusivepublishing.org</a>
`;

const plainTextResetMessage = (linkTokenUrl) => `
Hello,

Someone has requested a password reset for this account on epubtest.org. If it was not you, then please disregard this message.

To reset your password, paste this link into your browser:
${linkTokenUrl}.

Don't hesitate to contact us at epubtest@daisy.org with any questions.

Thanks,

The DAISY Consortium
daisy.org
epubtest.org
inclusivepublishing.org
`;

const htmlResetMessage = (linkTokenUrl) => `
<p>Hello,</p>

<p>Someone has requested a password reset for this account on  <a href="http://epubtest.org">epubtest.org</a>.
If it was not you, then please disregard this message.</p>

<p><a href="${linkTokenUrl}">Reset your password</a></p>

<p>Don't hesitate to <a href="mailto:epubtest@daisy.org">contact us</a> with any questions.</p>

<p>Thanks,
<br/>
<span>The DAISY Consortium</span>
<br/>
<a href="http://daisy.org">daisy.org</a>
<br/>
<a href="http://epubtest.org">epubtest.org</a>
<br/>
<a href="http://inclusivepublishing.org">inclusivepublishing.org</a>
`;