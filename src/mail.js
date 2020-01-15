const nodemailer = require("nodemailer");
const aws = require('aws-sdk');

async function testEmail(emailAddress) {
    try {
        await sendEmail(
            "Someone",
            emailAddress, 
            "Test message from epubtest.org",
            "This is a test message from epubtest.org. "
            
        );
        console.log("Message sent");
    }
    catch(err) {
        console.log("Error sending invitation ", err);
        return res.redirect('/server-error');
    };
}

async function emailInvitation(userId) {
    try {
        let userData = await db.query(Q.USER_PROFILE_EXTENDED(userId));
        await sendEmail(
            userData.email, 
            "Invitation to contribute to epubtest.org",
            
        );
        console.log("Message sent");
    }
    catch(err) {
        console.log("Error sending invitation ", err);
        return res.redirect('/server-error');
    };
}

function emailPasswordReset(userId) {

}

async function sendEmail(name, toAddress, subject, messageBody) {
    if (process.env.MODE == 'LOCALDEV') {
        // can test locally with mailserver running e.g. npx aws-ses-local
        aws.config.update({ region: 'us-east-1', endpoint: 'http://localhost:9001' });
    }
    else {
        aws.config.update({ region: 'us-east-1'});
    }

    let opts = {
        SES: new aws.SES({
            apiVersion: '2010-12-01'
        })
    };
    let transport = nodemailer.createTransport(opts);
    let info = await transport.sendMail({
        from: '"epubtest.org" <epubtest@daisy.org>',
        to: `"${name}" <${toAddress}>`,
        subject: subject,
        text: messageBody
    });    
}

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


module.exports = {
    emailInvitation,
    emailPasswordReset,
    testEmail
};