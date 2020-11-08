module.exports = {
    
    invite: {
        subject: 'Invitation to participate in epubtest.org',
        text: linkTokenUrl => `
Greetings!

This is a message from the DAISY Consortium, to invite you to participate in
Reading System Accessibility Testing at epubtest.org.

To accept this invitation, paste this link into your browser:
${linkTokenUrl}

Don't hesitate to write back with any questions!

Best regards,

The DAISY Consortium
daisy.org
epubtest.org
inclusivepublishing.org
`,

        html: linkTokenUrl => `
<p>Greetings!</p>

<p>This is a message from the <a href="http://daisy.org">DAISY Consortium</a>, to invite you to participate in
Reading System Accessibility Testing at <a href="http://epubtest.org">epubtest.org</a>.

<p><a href="${linkTokenUrl}">Accept this invitation</a> to proceed.</p>

<p>Don't hesitate to write back with any questions!</p>

<p>Best regards,
<br/>
<span>The DAISY Consortium</span>
<br/>
<a href="http://daisy.org">daisy.org</a>
<br/>
<a href="http://epubtest.org">epubtest.org</a>
<br/>
<a href="http://inclusivepublishing.org">inclusivepublishing.org</a>
`
},

    reset: {
        subject: 'Password reset requested for epubtest.org',
        text: linkTokenUrl => `
Hello,

Someone has requested a password reset for this account on epubtest.org. If it was not you, then please disregard this message.

To reset your password, paste this link into your browser:
${linkTokenUrl}

Don't hesitate to write back with any questions.

Best regards,

The DAISY Consortium
daisy.org
epubtest.org
inclusivepublishing.org
`,

        html: linkTokenUrl => `
<p>Hello,</p>

<p>Someone has requested a password reset for this account on  <a href="http://epubtest.org">epubtest.org</a>.
If it was not you, then please disregard this message.</p>

<p><a href="${linkTokenUrl}">Reset your password</a></p>

<p>Don't hesitate to write back with any questions.</p>

<p>Best regards,
<br/>
<span>The DAISY Consortium</span>
<br/>
<a href="http://daisy.org">daisy.org</a>
<br/>
<a href="http://epubtest.org">epubtest.org</a>
<br/>
<a href="http://inclusivepublishing.org">inclusivepublishing.org</a>
`
}
}