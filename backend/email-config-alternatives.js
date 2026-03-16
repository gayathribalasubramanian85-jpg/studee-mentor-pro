// Alternative email configurations for production

// Option 1: Gmail with different settings
const gmailAlternative = {
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
};

// Option 2: Outlook/Hotmail
const outlookConfig = {
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
    auth: {
        user: 'your-email@outlook.com',
        pass: 'your-password'
    }
};

// Option 3: Yahoo Mail
const yahooConfig = {
    service: 'yahoo',
    auth: {
        user: 'your-email@yahoo.com',
        pass: 'your-app-password'
    }
};

// Option 4: Custom SMTP (like cPanel hosting)
const customSMTP = {
    host: 'mail.yourdomain.com',
    port: 587,
    secure: false,
    auth: {
        user: 'noreply@yourdomain.com',
        pass: 'your-password'
    }
};

module.exports = {
    gmailAlternative,
    outlookConfig,
    yahooConfig,
    customSMTP
};