const nodemailer = require("nodemailer");
const aws = require('aws-sdk');

if (process.env.MODE == 'LOCALDEV') {
    // can test locally with mailserver running e.g. npx aws-ses-local
    aws.config.update({ region: 'us-east-1', endpoint: 'http://localhost:9001' });
}
else {
    aws.config.update({ region: 'us-east-1'});
}

async function emailInvitation(userId) {
    try {
        let opts = {
            SES: new aws.SES({
                apiVersion: '2010-12-01'
            })
        };
        let transport = nodemailer.createTransport(opts);
        let info = await transporter().sendMail({
            from: '"epubtest.org" <epubtest@daisy.org>',
            to: '"aws test" <success@simulator.amazonses.com>',
            subject: "Hello ✔",
            text: "Hello world?"
        });

        console.log("Message sent", info.messageId);
    }
    catch (err) {
        console.log("Error sending email ", err);
    }

}

function emailPasswordReset(userId) {

}

module.exports = {
    emailInvitation,
    emailPasswordReset
};