let invite = {
        subject: 'Invitation to participate in epubtest.org',
        text: linkTokenUrl => `
Greetings!

This is a message from the DAISY Consortium, to invite you to participate in
Reading System Accessibility Testing at epubtest.org.

To accept this invitation, paste this link into your browser:
${linkTokenUrl}

And, please don't share your invitation link with anyone - it was generated for your use only.

Don't hesitate to write back with any questions!

Best regards,

The DAISY Consortium
daisy.org
epubtest.org
inclusivepublishing.org
`,

        html: linkTokenUrl => `
<p>Greetings!</p>

<p>This is a message from the <a href="https://daisy.org">DAISY Consortium</a>, to invite you to participate in
Reading System Accessibility Testing at <a href="https://epubtest.org">epubtest.org</a>.

<p><a href="${linkTokenUrl}">Accept this invitation</a> to proceed. And, please don't share your invitation link with anyone - it was generated for your use only.</p>


<p>Don't hesitate to write back with any questions!</p>

<p>Best regards,
<br/>
<span>The DAISY Consortium</span>
<br/>
<a href="https://daisy.org">daisy.org</a>
<br/>
<a href="https://epubtest.org">epubtest.org</a>
<br/>
<a href="https://inclusivepublishing.org">inclusivepublishing.org</a>
`
};

let reset = {
        subject: 'Password reset requested for epubtest.org',
        text: linkTokenUrl => `
Hello,

Someone has requested a password reset for this account on epubtest.org. If it was not you, then please disregard this message.

To reset your password, paste this link into your browser:
${linkTokenUrl}

Please don't share your reset link with anyone - it was generated for your use only.

Don't hesitate to write back with any questions.

Best regards,

The DAISY Consortium
daisy.org
epubtest.org
inclusivepublishing.org
`,

        html: linkTokenUrl => `
<p>Hello,</p>

<p>Someone has requested a password reset for this account on  <a href="https://epubtest.org">epubtest.org</a>.
If it was not you, then please disregard this message.</p>

<p><a href="${linkTokenUrl}">Reset your password</a></p>

<p>Please don't share your reset link with anyone - it was generated for your use only.</p>

<p>Don't hesitate to write back with any questions.</p>

<p>Best regards,
<br/>
<span>The DAISY Consortium</span>
<br/>
<a href="https://daisy.org">daisy.org</a>
<br/>
<a href="https://epubtest.org">epubtest.org</a>
<br/>
<a href="https://inclusivepublishing.org">inclusivepublishing.org</a>
`
};

let newRequest = {
        subject: 'New request on epubtest.org',
        text: answerSet => `
Hello,

Someone has requested to publish or unpublish results for ${answerSet.testingEnvironment.readingSystem.name} ${answerSet.testingEnvironment.readingSystem.version} 
on epubtest.org. Please login and go to https://epubtest.org/admin/requests to manage and approve pending requests.

- epubtest.org
`,

        html: answerSet => `
<p>Hello,</p>

<p>Someone has requested to publish results for ${answerSet.testingEnvironment.readingSystem.name} ${answerSet.testingEnvironment.readingSystem.version} 
on epubtest.org. Please login and go to the <a href="https://epubtest.org/admin/requests">Admin Requests Page</a> to manage and approve pending requests.</p>
<br/>
<p>- epubtest.org</p>
`
};

export { invite, reset, newRequest };