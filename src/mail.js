const nodemailer = require("nodemailer");

var transporter = () => {
  let localOpts = {
    host: process.env.MAILHOST,
    port: process.env.MAILPORT,
    secure: false, 
    tls: {
      rejectUnauthorized: false
    }
  };
  let sendmailOpts = {
    sendmail: true,
    newline: 'unix',
    path: '/usr/sbin/sendmail'
  };
  
  let opts = process.env.MODE == 'LOCALDEV' ? localOpts: sendmailOpts;
  
  return nodemailer.createTransport(opts);
}

async function emailInvitation(userId) {
    let info = await transporter().sendMail({
        from: '"epubtest.org" <epubtest@daisy.org>',
        to: "Marisa DeMeglio <marisa.demeglio@gmail.com>",
        subject: "Hello ✔", 
        text: "Hello world?"
    });

    console.log("Message sent", info.messageId);   
}

function emailPasswordReset(userId) {

}

module.exports = {
    emailInvitation,
    emailPasswordReset
};