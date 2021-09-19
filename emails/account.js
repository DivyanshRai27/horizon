const sgMail = require('@sendgrid/mail')

const sendgridAPIKey = ''

sgMail.setApiKey(sendgridAPIKey)

const sendWelcomeEmail = (username, name) => {
    sgMail.send({
        to: username,
        from: 'divyanshrai27@gmail.com',
        subject: 'Thanks for registeration',
        text: `Hello, ${name}.Welcome to our health management portal !!!`
    })
}

module.exports = {
    sendWelcomeEmail
}