const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
    // Enhanced configuration for production environments
    return nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: process.env.NODE_ENV === 'production' ? 465 : 587,
        secure: process.env.NODE_ENV === 'production', // true for 465, false for other ports
        family: 4, // Force IPv4 to avoid ENETUNREACH errors on cloud platforms
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        tls: {
            // Do not fail on invalid certificates (common on some shared hosts)
            rejectUnauthorized: false
        },
        // Add timeout settings for production
        connectionTimeout: 60000, // 60 seconds
        greetingTimeout: 30000,   // 30 seconds
        socketTimeout: 60000      // 60 seconds
    });
};

// Send email to multiple recipients with admin context
const sendEmail = async (recipients, subject, htmlContent, textContent = '', adminInfo = null) => {
    try {
        console.log("=== SENDING EMAIL ===");
        console.log("Recipients:", recipients.length);
        console.log("Subject:", subject);
        console.log("Admin Info:", adminInfo);

        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.error("❌ Email credentials not configured!");
            console.error("EMAIL_USER:", process.env.EMAIL_USER ? "✓ Set" : "❌ Missing");
            console.error("EMAIL_PASS:", process.env.EMAIL_PASS ? "✓ Set" : "❌ Missing");
            return { success: false, message: 'Email credentials not configured' };
        }

        console.log("✓ Email credentials found");
        console.log("✓ EMAIL_USER:", process.env.EMAIL_USER);
        console.log("✓ NODE_ENV:", process.env.NODE_ENV);

        const transporter = createTransporter();

        // Test connection in production
        if (process.env.NODE_ENV === 'production') {
            try {
                console.log("🔍 Testing SMTP connection...");
                await transporter.verify();
                console.log("✅ SMTP connection successful");
            } catch (verifyError) {
                console.error("❌ SMTP connection failed:", verifyError.message);
                console.error("Full error:", verifyError);
                return { success: false, message: `SMTP connection failed: ${verifyError.message}` };
            }
        }

        // Send email to each recipient individually to avoid exposing email addresses
        const emailPromises = recipients.map(async (email) => {
            try {
                // Determine sender information
                let fromName = process.env.EMAIL_FROM_NAME || 'PlacePrep';
                let fromEmail = process.env.EMAIL_USER;
                let replyToEmail = process.env.EMAIL_USER;

                // If admin info is provided, personalize the email
                if (adminInfo && adminInfo.email && adminInfo.name) {
                    fromName = adminInfo.name;
                    replyToEmail = adminInfo.email;
                    // Format: "Admin Name <system@email.com>"
                    fromEmail = `"${adminInfo.name}" <${process.env.EMAIL_USER}>`;
                } else {
                    fromEmail = `"${fromName}" <${process.env.EMAIL_USER}>`;
                }

                const mailOptions = {
                    from: fromEmail,
                    to: email,
                    replyTo: replyToEmail, // Replies will go to admin's email
                    subject: subject,
                    html: htmlContent,
                    text: textContent || htmlContent.replace(/<[^>]*>/g, '') // Strip HTML for text version
                };

                const result = await transporter.sendMail(mailOptions);
                console.log(`Email sent successfully to ${email} from ${fromName} (reply-to: ${replyToEmail})`);
                return { email, success: true, messageId: result.messageId };
            } catch (error) {
                console.error(`Failed to send email to ${email}:`, error.message);
                return { email, success: false, error: error.message };
            }
        });

        const results = await Promise.all(emailPromises);
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        console.log(`Email sending completed: ${successful} successful, ${failed} failed`);
        
        return {
            success: true,
            totalSent: successful,
            totalFailed: failed,
            results: results
        };

    } catch (error) {
        console.error('Error in email service:', error);
        return {
            success: false,
            message: error.message,
            totalSent: 0,
            totalFailed: recipients.length
        };
    }
};

// Email templates
const createMaterialNotificationEmail = (studentName, materialTitle, weekNumber, department, adminName) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Study Material Available</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1e3a8a 0%, #0891b2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px 20px; border-radius: 0 0 10px 10px; }
            .highlight { background: #e0f2fe; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0891b2; }
            .button { display: inline-block; background: #0891b2; color: white !important; text-decoration: none; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
            
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <svg style="font-size: 18px; margin-right: 8px;" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/>
                </svg>
                <h1>New Study Material Available</h1>
                <p>PlacePrep - Faculty Portal</p>
            </div>
            <div class="content">
                <p>Dear <strong>${studentName}</strong>,</p>
                
                <p>A new study material has been uploaded for your department!</p>
                
                <div class="highlight">
                    <h3>
                        <svg style="font-size: 18px; margin-right: 8px;" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/>
                        </svg>
                        Material Details:
                    </h3>
                    <p><strong>Title:</strong> ${materialTitle}</p>
                    <p><strong>Week:</strong> ${weekNumber}</p>
                    <p><strong>Department:</strong> ${department}</p>
                    <p><strong>Uploaded by:</strong> ${adminName}</p>
                </div>
                
                <p>Please log in to your student portal to access the new material and continue your learning journey.</p>
                
                <a href="${process.env.FRONTEND_URL}/student/study" class="button">
                    <svg style="font-size: 18px; margin-right: 8px;" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 715.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/>
                    </svg>
                    Access Study Materials
                </a>
                
                <p>Keep up the great work with your studies!</p>
                
                <p>Best regards,<br>
                <strong>${adminName}</strong><br>
                ${department} Department</p>
            </div>
            <div class="footer">
                <p>This is an automated notification from PlacePrep Faculty Portal</p>
                <p>Please do not reply to this email</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

const createTestNotificationEmail = (studentName, testTitle, department, adminName, duration, passMarks) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Test Available</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1e3a8a 0%, #0891b2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px 20px; border-radius: 0 0 10px 10px; }
            .highlight { background: #e0f2fe; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0891b2; }
            .button { display: inline-block; background: #0891b2; color: white !important; text-decoration: none; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
            
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <svg style="font-size: 18px; margin-right: 8px;" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                    <path fill-rule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 001 1h6a1 1 0 001-1V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/>
                </svg>
                <h1>New Test Available</h1>
                <p>PlacePrep - Faculty Portal</p>
            </div>
            <div class="content">
                <p>Dear <strong>${studentName}</strong>,</p>
                
                <p>A new test has been created for your department. Time to showcase your knowledge!</p>
                
                <div class="highlight">
                    <h3>
                        <svg style="font-size: 18px; margin-right: 8px;" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                            <path fill-rule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 001 1h6a1 1 0 001-1V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/>
                        </svg>
                        Test Details:
                    </h3>
                    <p><strong>Title:</strong> ${testTitle}</p>
                    <p><strong>Department:</strong> ${department}</p>
                    <p><strong>Duration:</strong> ${duration} minutes</p>
                    <p><strong>Pass Marks:</strong> ${passMarks}</p>
                    <p><strong>Created by:</strong> ${adminName}</p>
                </div>
                
                <p>Please log in to your student portal to take the test. Make sure you're well prepared!</p>
                
                <a href="${process.env.FRONTEND_URL}/student/tests" class="button">
                    <svg style="font-size: 18px; margin-right: 8px;" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                        <path fill-rule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 001 1h6a1 1 0 001-1V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/>
                    </svg>
                    Take Test
                </a>
                
                <p>Good luck with your test!</p>
                
                <p>Best regards,<br>
                <strong>${adminName}</strong><br>
                ${department} Department</p>
            </div>
            <div class="footer">
                <p>This is an automated notification from PlacePrep Faculty Portal</p>
                <p>Please do not reply to this email</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

// Send material notification
const sendMaterialNotification = async (students, materialTitle, weekNumber, department, adminName, adminEmail = null) => {
    try {
        console.log("=== MATERIAL NOTIFICATION FUNCTION ===");
        console.log("Students to notify:", students.length);
        console.log("Material:", materialTitle);
        console.log("Week:", weekNumber);
        console.log("Department:", department);
        console.log("Admin:", adminName);
        console.log("Admin Email:", adminEmail);

        if (!students || students.length === 0) {
            return {
                success: false,
                totalSent: 0,
                message: 'No students provided for notification'
            };
        }

        let totalSent = 0;
        let totalFailed = 0;

        // Prepare admin info for personalized emails
        const adminInfo = adminEmail ? { name: adminName, email: adminEmail } : null;

        // Send email to each student individually
        for (const student of students) {
            try {
                console.log(`Sending email to: ${student.name} (${student.email})`);
                
                const subject = `📚 New Study Material: ${materialTitle} - Week ${weekNumber}`;
                const htmlContent = createMaterialNotificationEmail(
                    student.name,
                    materialTitle,
                    weekNumber,
                    department,
                    adminName
                );
                
                const result = await sendEmail([student.email], subject, htmlContent, '', adminInfo);
                
                if (result.success && result.totalSent > 0) {
                    totalSent++;
                    console.log(`✅ Email sent successfully to ${student.email}`);
                } else {
                    totalFailed++;
                    console.log(`❌ Failed to send email to ${student.email}:`, result.message);
                }
            } catch (error) {
                totalFailed++;
                console.error(`❌ Error sending email to ${student.email}:`, error.message);
            }
        }

        console.log(`=== EMAIL SUMMARY: ${totalSent} sent, ${totalFailed} failed ===`);
        
        return {
            success: true,
            totalSent: totalSent,
            totalFailed: totalFailed,
            message: `Material notification sent to ${totalSent} students`
        };
    } catch (error) {
        console.error('Error in sendMaterialNotification:', error);
        return {
            success: false,
            totalSent: 0,
            message: error.message
        };
    }
};

// Send test notification
const sendTestNotification = async (students, testTitle, department, adminName, duration, passMarks, adminEmail = null) => {
    try {
        console.log("=== TEST NOTIFICATION FUNCTION ===");
        console.log("Students to notify:", students.length);
        console.log("Test:", testTitle);
        console.log("Department:", department);
        console.log("Admin:", adminName);
        console.log("Admin Email:", adminEmail);

        if (!students || students.length === 0) {
            return {
                success: false,
                totalSent: 0,
                message: 'No students provided for notification'
            };
        }

        let totalSent = 0;
        let totalFailed = 0;

        // Prepare admin info for personalized emails
        const adminInfo = adminEmail ? { name: adminName, email: adminEmail } : null;

        // Send email to each student individually
        for (const student of students) {
            try {
                console.log(`Sending email to: ${student.name} (${student.email})`);
                
                const subject = `📝 New Test Available: ${testTitle}`;
                const htmlContent = createTestNotificationEmail(
                    student.name,
                    testTitle,
                    department,
                    adminName,
                    duration,
                    passMarks
                );
                
                const result = await sendEmail([student.email], subject, htmlContent, '', adminInfo);
                
                if (result.success && result.totalSent > 0) {
                    totalSent++;
                    console.log(`✅ Email sent successfully to ${student.email}`);
                } else {
                    totalFailed++;
                    console.log(`❌ Failed to send email to ${student.email}:`, result.message);
                }
            } catch (error) {
                totalFailed++;
                console.error(`❌ Error sending email to ${student.email}:`, error.message);
            }
        }

        console.log(`=== EMAIL SUMMARY: ${totalSent} sent, ${totalFailed} failed ===`);
        
        return {
            success: true,
            totalSent: totalSent,
            totalFailed: totalFailed,
            message: `Test notification sent to ${totalSent} students`
        };
    } catch (error) {
        console.error('Error in sendTestNotification:', error);
        return {
            success: false,
            totalSent: 0,
            message: error.message
        };
    }
};

// Create placement drive notification email template
const createPlacementNotificationEmail = (studentName, companyName, role, ctc, location, deadline, placementOfficerName) => {
    const formattedDeadline = new Date(deadline).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Placement Opportunity</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1e3a8a 0%, #0891b2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px 20px; border-radius: 0 0 10px 10px; }
            .highlight { background: #e0f2fe; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0891b2; }
            .job-details { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .button { display: inline-block; background: #0891b2; color: white !important; text-decoration: none; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .button:hover { background: #1e40af; }
            .deadline { background: #fef3c7; color: #92400e; padding: 10px; border-radius: 5px; border-left: 4px solid #f59e0b; margin: 15px 0; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
            
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <svg style="font-size: 18px; margin-right: 8px;" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clip-rule="evenodd"/>
                    <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z"/>
                </svg>
                <h1>New Placement Opportunity!</h1>
                <p>PlacePrep - Placement Portal</p>
            </div>
            <div class="content">
                <p>Dear <strong>${studentName}</strong>,</p>
                
                <p>Great news! A new placement opportunity has been posted that matches your profile.</p>
                
                <div class="job-details">
                    <h3>
                        <svg style="font-size: 18px; margin-right: 8px;" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2v1h12V6H4zm0 3v5h12V9H4z" clip-rule="evenodd"/>
                        </svg>
                        Job Details:
                    </h3>
                    <p><strong>Company:</strong> ${companyName}</p>
                    <p><strong>Role:</strong> ${role}</p>
                    <p><strong>CTC:</strong> ${ctc}</p>
                    <p><strong>Location:</strong> ${location}</p>
                </div>
                
                <div class="deadline">
                    <svg style="font-size: 18px; margin-right: 8px;" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
                    </svg>
                    <strong>Application Deadline:</strong> ${formattedDeadline}
                </div>
                
                <div class="highlight">
                    <p>
                        <svg style="font-size: 18px; margin-right: 8px;" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                        </svg>
                        <strong>You are eligible for this opportunity!</strong>
                    </p>
                    <p>Don't miss out on this chance to kickstart your career. Log in to your student portal to view complete details and apply.</p>
                </div>
                
                <a href="${process.env.FRONTEND_URL}/student/placements" class="button">
                    <svg style="font-size: 18px; margin-right: 8px;" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clip-rule="evenodd"/>
                    </svg>
                    View & Apply Now
                </a>
                
                <p>Best of luck with your application!</p>
                
                <p>Best regards,<br>
                <strong>${placementOfficerName}</strong><br>
                Placement Officer</p>
            </div>
            <div class="footer">
                <p>This is an automated notification from PlacePrep Placement Portal</p>
                <p>Please do not reply to this email</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

// Send placement drive notifications to eligible students
const sendPlacementNotification = async (students, jobDetails, placementOfficerName, placementOfficerEmail = null) => {
    try {
        console.log("=== PLACEMENT NOTIFICATION FUNCTION ===");
        console.log("Students to notify:", students.length);
        console.log("Company:", jobDetails.companyName);
        console.log("Role:", jobDetails.role);
        console.log("Placement Officer:", placementOfficerName);
        console.log("Placement Officer Email:", placementOfficerEmail);

        if (!students || students.length === 0) {
            return {
                success: false,
                totalSent: 0,
                message: 'No students provided for notification'
            };
        }

        let totalSent = 0;
        let totalFailed = 0;

        // Prepare placement officer info for personalized emails
        const adminInfo = placementOfficerEmail ? { name: placementOfficerName, email: placementOfficerEmail } : null;

        // Send email to each student individually
        for (const student of students) {
            try {
                console.log(`Sending placement email to: ${student.name} (${student.email})`);
                
                const subject = `🎯 New Placement Opportunity: ${jobDetails.role} at ${jobDetails.companyName}`;
                const htmlContent = createPlacementNotificationEmail(
                    student.name,
                    jobDetails.companyName,
                    jobDetails.role,
                    jobDetails.ctc,
                    jobDetails.location,
                    jobDetails.deadline,
                    placementOfficerName
                );
                
                const result = await sendEmail([student.email], subject, htmlContent, '', adminInfo);
                
                if (result.success && result.totalSent > 0) {
                    totalSent++;
                    console.log(`✅ Placement email sent successfully to ${student.email}`);
                } else {
                    totalFailed++;
                    console.log(`❌ Failed to send placement email to ${student.email}:`, result.message);
                }
            } catch (error) {
                totalFailed++;
                console.error(`❌ Error sending placement email to ${student.email}:`, error.message);
            }
        }

        console.log(`=== PLACEMENT EMAIL SUMMARY: ${totalSent} sent, ${totalFailed} failed ===`);
        
        return {
            success: true,
            totalSent: totalSent,
            totalFailed: totalFailed,
            message: `Placement notification sent to ${totalSent} eligible students`
        };
    } catch (error) {
        console.error('Error in sendPlacementNotification:', error);
        return {
            success: false,
            totalSent: 0,
            message: error.message
        };
    }
};

module.exports = {
    sendEmail,
    sendMaterialNotification,
    sendTestNotification,
    sendPlacementNotification,
    createMaterialNotificationEmail,
    createTestNotificationEmail,
    createPlacementNotificationEmail
};





