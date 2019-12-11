const nodemailer = require("nodemailer");

var transporter = () => {
  let auth =  {
      auth: {
        user: process.env.MAILUSER,
        pass: process.env.MAILPASS
      }
  };
  let tls = {
    tls: {
      rejectUnauthorized: false
    }
  };
  let opts = {
    host: process.env.MAILHOST,
    port: process.env.MAILPORT,
    secure: false, 
  };
  if (process.env.MODE == 'LOCALDEV') {
    opts = {...opts, ...tls};
  }
  else {
    opts = {...opts, ...auth};
  }
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