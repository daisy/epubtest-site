module.exports = {
    reinvite: {
        subject:'Your account on epubtest.org',
        text: linkTokenUrl => `
Greetings!

This is a message from the DAISY Consortium, to invite you to continue your participation in
Reading System Accessibility Testing at the newly redesigned epubtest.org.

We've just redesigned our website to be more streamlined and accessibility-focused, and we'd like to 
let you know that your account has been transferred to the new site.

To complete this process, paste this link into your browser and set a password for your account:
${linkTokenUrl}.

Then login with this email address and your new password, and set up your profile.

Don't hesitate to contact us at epubtest@daisy.org with any questions.

Thanks,

The DAISY Consortium
daisy.org
epubtest.org
inclusivepublishing.org
`,

        html: linkTokenUrl => `
<p>Greetings!</p>

<p>This is a message from the <a href="http://daisy.org">DAISY Consortium</a>, to invite you to continue your participation in
Reading System Accessibility Testing at the newly redesigned <a href="http://epubtest.org">epubtest.org</a>.

<p>We've just redesigned our website to be more streamlined and accessibility-focused, and we'd like to 
let you know that your account has been transferred to the new site.</p>

<p>To complete this process, <a href="${linkTokenUrl}">accept this invitation</a></p> and set a password for your account.

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
`},

    invite: {
        subject: 'Invitation to participate in epubtest.org',
        text: linkTokenUrl => `
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
`,

        html: linkTokenUrl => `
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
`
},

    reset: {
        subject: 'Password reset requested for epubtest.org',
        text: linkTokenUrl => `
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
`,

        html: linkTokenUrl => `
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
`
}
}