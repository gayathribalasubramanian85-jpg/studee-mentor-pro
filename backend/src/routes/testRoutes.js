const express = require('express');
const router = express.Router();
const { sendEmail } = require('../utils/emailService');

// Test email endpoint for debugging production issues
router.post('/test-email', async (req, res) => {
    try {
        console.log("🧪 Testing email functionality...");
        
        const { email } = req.body;
        const testEmail = email || 'gayu118513@gmail.com';
        
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">📧 Email Test Successful!</h2>
                <p>This is a test email from your PlacePrep application.</p>
                <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h3>Environment Details:</h3>
                    <ul>
                        <li><strong>NODE_ENV:</strong> ${process.env.NODE_ENV}</li>
                        <li><strong>EMAIL_USER:</strong> ${process.env.EMAIL_USER}</li>
                        <li><strong>Timestamp:</strong> ${new Date().toISOString()}</li>
                    </ul>
                </div>
                <p>If you received this email, your email configuration is working correctly! 🎉</p>
            </div>
        `;
        
        const result = await sendEmail(
            [testEmail],
            '🧪 PlacePrep Email Test',
            htmlContent,
            'This is a test email from PlacePrep application.'
        );
        
        console.log("📧 Email test result:", result);
        
        res.json({
            success: true,
            message: 'Test email sent successfully',
            details: result,
            environment: {
                NODE_ENV: process.env.NODE_ENV,
                EMAIL_USER: process.env.EMAIL_USER,
                hasEmailPass: !!process.env.EMAIL_PASS
            }
        });
        
    } catch (error) {
        console.error("❌ Email test failed:", error);
        res.status(500).json({
            success: false,
            message: 'Email test failed',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

module.exports = router;