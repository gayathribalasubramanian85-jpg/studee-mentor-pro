const cron = require('node-cron');
const Student = require('../models/Student');
const StudyMaterial = require('../models/StudyMaterial');
const Test = require('../models/Test');
const StudyLog = require('../models/StudyLog');
const TestResult = require('../models/TestResult');
const Week = require('../models/Week');
const Job = require('../models/Job');
const Application = require('../models/Application');
const { sendEmail } = require('../utils/emailService');

// Create reminder email templates
const createStudyReminderEmail = (studentName, materials, adminName, adminEmail) => {
    const materialsList = materials.map(m => 
        `<li style="margin: 8px 0; padding: 8px; background: #f8f9fa; border-radius: 4px;">
            <strong>${m.title}</strong> - Week ${m.week}
            <br><small style="color: #666;">Type: ${m.type.toUpperCase()}</small>
        </li>`
    ).join('');

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Study Reminder</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #dc2626 0%, #ea580c 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px 20px; border-radius: 0 0 10px 10px; }
            .highlight { background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626; }
            .materials-list { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .button { display: inline-block; background: #dc2626; color: white !important; text-decoration: none; padding: 12px 25px; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>⏰ Study Reminder</h1>
                <p>Don't fall behind on your studies!</p>
            </div>
            <div class="content">
                <p>Dear <strong>${studentName}</strong>,</p>
                
                <div class="highlight">
                    <h3>📚 You have pending study materials!</h3>
                    <p>We noticed you haven't studied the following materials yet. Stay on track with your learning goals!</p>
                </div>
                
                <div class="materials-list">
                    <h4>Pending Materials:</h4>
                    <ul style="list-style: none; padding: 0;">
                        ${materialsList}
                    </ul>
                </div>
                
                <p>Regular study habits are key to academic success. Please log in to your student portal and catch up on these materials.</p>
                
                <a href="${process.env.FRONTEND_URL}/student/study" class="button">
                    📖 Start Studying Now
                </a>
                
                <p><strong>Remember:</strong> Consistent daily study leads to better understanding and exam performance!</p>
                
                <p>Best regards,<br>
                <strong>${adminName}</strong><br>
                Department Faculty</p>
            </div>
            <div class="footer">
                <p>This is an automated study reminder from PlacePrep</p>
                <p>Study regularly to achieve your academic goals!</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

const createJobApplicationReminderEmail = (studentName, jobs, placementOfficerName, placementOfficerEmail) => {
    const jobsList = jobs.map(job => {
        const deadline = new Date(job.deadline).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        return `<li style="margin: 8px 0; padding: 12px; background: #f8f9fa; border-radius: 4px; border-left: 4px solid #0891b2;">
            <div style="display: flex; justify-content: between; align-items: start;">
                <div style="flex: 1;">
                    <strong style="color: #1e40af;">${job.companyName}</strong> - ${job.role}
                    <br><small style="color: #666;">CTC: ${job.ctc} | Location: ${job.location}</small>
                    <br><small style="color: #dc2626; font-weight: bold;">⏰ Deadline: ${deadline}</small>
                </div>
            </div>
        </li>`;
    }).join('');

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Job Application Reminder</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0891b2 0%, #1e40af 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px 20px; border-radius: 0 0 10px 10px; }
            .highlight { background: #e0f2fe; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0891b2; }
            .jobs-list { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .button { display: inline-block; background: #0891b2; color: white !important; text-decoration: none; padding: 12px 25px; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .urgent { background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>💼 Job Application Reminder</h1>
                <p>Don't miss these career opportunities!</p>
            </div>
            <div class="content">
                <p>Dear <strong>${studentName}</strong>,</p>
                
                <div class="highlight">
                    <h3>🎯 You have pending job applications!</h3>
                    <p>We noticed you haven't applied for these placement opportunities yet. These positions match your profile and could be perfect for your career!</p>
                </div>
                
                <div class="jobs-list">
                    <h4>Available Opportunities:</h4>
                    <ul style="list-style: none; padding: 0;">
                        ${jobsList}
                    </ul>
                </div>
                
                <div class="urgent">
                    <h4>⚠️ Don't Wait Too Long!</h4>
                    <p>Application deadlines are approaching. The sooner you apply, the better your chances of getting selected. Many companies follow a first-come-first-served basis for screening.</p>
                </div>
                
                <p>Log in to your student portal to view complete job details and submit your applications now!</p>
                
                <a href="${process.env.FRONTEND_URL}/student/placements" class="button">
                    🚀 Apply Now
                </a>
                
                <p><strong>Tips for Success:</strong></p>
                <ul style="margin-left: 20px;">
                    <li>Update your resume before applying</li>
                    <li>Read job requirements carefully</li>
                    <li>Apply early to increase your chances</li>
                    <li>Prepare for interviews in advance</li>
                </ul>
                
                <p>Best of luck with your applications!</p>
                
                <p>Best regards,<br>
                <strong>${placementOfficerName}</strong><br>
                Placement Officer</p>
            </div>
            <div class="footer">
                <p>This is an automated job application reminder from PlacePrep</p>
                <p>Your career success is our priority!</p>
            </div>
        </div>
    </body>
    </html>
    `;
};
const createTestReminderEmail = (studentName, tests, adminName, adminEmail) => {
    const testsList = tests.map(t => 
        `<li style="margin: 8px 0; padding: 8px; background: #f8f9fa; border-radius: 4px;">
            <strong>${t.title}</strong>
            <br><small style="color: #666;">Duration: ${t.duration} minutes | Pass Marks: ${t.passMarks}</small>
        </li>`
    ).join('');

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Test Reminder</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #7c3aed 0%, #2563eb 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px 20px; border-radius: 0 0 10px 10px; }
            .highlight { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #7c3aed; }
            .tests-list { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .button { display: inline-block; background: #7c3aed; color: white !important; text-decoration: none; padding: 12px 25px; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📝 Test Reminder</h1>
                <p>Time to showcase your knowledge!</p>
            </div>
            <div class="content">
                <p>Dear <strong>${studentName}</strong>,</p>
                
                <div class="highlight">
                    <h3>⚡ You have pending tests!</h3>
                    <p>Don't miss out on these important assessments. Taking tests regularly helps track your progress!</p>
                </div>
                
                <div class="tests-list">
                    <h4>Pending Tests:</h4>
                    <ul style="list-style: none; padding: 0;">
                        ${testsList}
                    </ul>
                </div>
                
                <p>Regular assessment is crucial for understanding your learning progress. Please log in and complete these tests.</p>
                
                <a href="${process.env.FRONTEND_URL}/student/tests" class="button">
                    🎯 Take Tests Now
                </a>
                
                <p><strong>Tip:</strong> Review your study materials before taking the tests for better performance!</p>
                
                <p>Best regards,<br>
                <strong>${adminName}</strong><br>
                Department Faculty</p>
            </div>
            <div class="footer">
                <p>This is an automated test reminder from PlacePrep</p>
                <p>Regular testing helps improve your knowledge!</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

// Check for students who haven't studied materials
const checkPendingStudyMaterials = async () => {
    try {
        console.log("=== CHECKING PENDING STUDY MATERIALS ===");
        
        // Get current week info
        const currentDate = new Date();
        const currentWeek = await Week.findOne({
            startDate: { $lte: currentDate },
            endDate: { $gte: currentDate }
        });

        if (!currentWeek) {
            console.log("No current week found, skipping study reminders");
            return;
        }

        console.log(`Current week: ${currentWeek.weekNumber} (${currentWeek.department})`);

        // Get all materials for current week
        const materials = await StudyMaterial.find({
            week: currentWeek.weekNumber,
            department: currentWeek.department,
            year: currentWeek.year
        });

        if (materials.length === 0) {
            console.log("No materials found for current week");
            return;
        }

        console.log(`Found ${materials.length} materials for current week`);

        // Get students for this department/year
        const students = await Student.find({
            department: currentWeek.department,
            year: currentWeek.year
        }).select('name email department year');

        console.log(`Found ${students.length} students to check`);

        let remindersToSend = [];

        // Check each student's study activity
        for (const student of students) {
            // Check if student has studied this week (has study logs for this week)
            const weekStart = new Date(currentWeek.startDate);
            const weekEnd = new Date(currentWeek.endDate);
            
            const studyLogs = await StudyLog.find({
                student: student._id,
                date: {
                    $gte: weekStart.toISOString().split('T')[0],
                    $lte: weekEnd.toISOString().split('T')[0]
                }
            });

            const totalStudyMinutes = studyLogs.reduce((acc, log) => acc + log.activeMinutes, 0);
            
            // If student hasn't studied enough (less than 30 minutes this week)
            if (totalStudyMinutes < 30) {
                console.log(`Student ${student.name} needs study reminder (${totalStudyMinutes} minutes studied)`);
                
                // Get admin info for this department
                const Faculty = require('../models/Faculty');
                const admin = await Faculty.findOne({ department: currentWeek.department });
                
                remindersToSend.push({
                    student: student,
                    materials: materials,
                    adminName: admin ? admin.name : 'Faculty',
                    adminEmail: admin ? admin.email : null
                });
            }
        }

        console.log(`Sending ${remindersToSend.length} study reminders`);

        // Send reminder emails
        for (const reminder of remindersToSend) {
            try {
                const subject = `📚 Daily Study Reminder - Week ${currentWeek.weekNumber} Materials`;
                const htmlContent = createStudyReminderEmail(
                    reminder.student.name,
                    reminder.materials,
                    reminder.adminName,
                    reminder.adminEmail
                );

                const adminInfo = reminder.adminEmail ? {
                    name: reminder.adminName,
                    email: reminder.adminEmail
                } : null;

                await sendEmail([reminder.student.email], subject, htmlContent, '', adminInfo);
                console.log(`✅ Study reminder sent to ${reminder.student.email}`);
            } catch (error) {
                console.error(`❌ Failed to send study reminder to ${reminder.student.email}:`, error.message);
            }
        }

        console.log("=== STUDY REMINDERS COMPLETED ===");
    } catch (error) {
        console.error("Error in checkPendingStudyMaterials:", error);
    }
};

// Check for students who haven't applied for available jobs
const checkPendingJobApplications = async () => {
    try {
        console.log("=== CHECKING PENDING JOB APPLICATIONS ===");
        
        // Get all active jobs that haven't passed deadline
        const currentDate = new Date();
        const activeJobs = await Job.find({
            deadline: { $gte: currentDate }
        }).sort({ deadline: 1 });

        if (activeJobs.length === 0) {
            console.log("No active jobs found");
            return;
        }

        console.log(`Found ${activeJobs.length} active jobs to check`);

        let remindersToSend = [];

        // Check each job for eligible students who haven't applied
        for (const job of activeJobs) {
            console.log(`Checking job: ${job.companyName} - ${job.role}`);

            // Build eligibility query based on job criteria
            let studentQuery = {
                interestedInPlacement: true // Only students interested in placement
            };

            // Filter by eligible departments
            if (job.eligibleDepartments && job.eligibleDepartments.length > 0) {
                studentQuery.department = { $in: job.eligibleDepartments };
            }

            // Apply criteria filters
            if (job.criteria) {
                if (job.criteria.minCGPA && job.criteria.minCGPA > 0) {
                    studentQuery.cgpa = { $gte: job.criteria.minCGPA };
                }
                if (job.criteria.minPercentage && job.criteria.minPercentage > 0) {
                    studentQuery.percentage = { $gte: job.criteria.minPercentage };
                }
                if (job.criteria.minAttendance && job.criteria.minAttendance > 0) {
                    studentQuery.attendance = { $gte: job.criteria.minAttendance };
                }
                if (job.criteria.noBacklogs === true) {
                    studentQuery.backlogs = { $lte: 0 };
                }
            }

            // Get eligible students for this job
            const eligibleStudents = await Student.find(studentQuery)
                .select('name email department cgpa percentage attendance backlogs')
                .lean();

            console.log(`Found ${eligibleStudents.length} eligible students for ${job.companyName}`);

            // Check which eligible students haven't applied
            for (const student of eligibleStudents) {
                const existingApplication = await Application.findOne({
                    student: student._id,
                    placement: job._id
                });

                if (!existingApplication) {
                    // Student is eligible but hasn't applied
                    console.log(`Student ${student.name} hasn't applied for ${job.companyName}`);
                    
                    // Find existing reminder entry for this student or create new one
                    let existingReminder = remindersToSend.find(r => 
                        r.student._id.toString() === student._id.toString()
                    );

                    if (existingReminder) {
                        // Add job to existing reminder
                        existingReminder.jobs.push(job);
                    } else {
                        // Get placement officer info
                        const PlacementOfficer = require('../models/PlacementOfficer');
                        const placementOfficer = await PlacementOfficer.findById(job.postedBy);
                        
                        // Create new reminder entry
                        remindersToSend.push({
                            student: student,
                            jobs: [job],
                            placementOfficerName: placementOfficer ? placementOfficer.name : 'Placement Officer',
                            placementOfficerEmail: placementOfficer ? placementOfficer.email : null
                        });
                    }
                }
            }
        }

        console.log(`Sending ${remindersToSend.length} job application reminders`);

        // Send reminder emails
        for (const reminder of remindersToSend) {
            try {
                const jobCount = reminder.jobs.length;
                const subject = `💼 Job Application Reminder - ${jobCount} Opportunity${jobCount > 1 ? 'ies' : 'y'} Waiting!`;
                const htmlContent = createJobApplicationReminderEmail(
                    reminder.student.name,
                    reminder.jobs,
                    reminder.placementOfficerName,
                    reminder.placementOfficerEmail
                );

                const adminInfo = reminder.placementOfficerEmail ? {
                    name: reminder.placementOfficerName,
                    email: reminder.placementOfficerEmail
                } : null;

                await sendEmail([reminder.student.email], subject, htmlContent, '', adminInfo);
                console.log(`✅ Job application reminder sent to ${reminder.student.email} (${jobCount} jobs)`);
            } catch (error) {
                console.error(`❌ Failed to send job application reminder to ${reminder.student.email}:`, error.message);
            }
        }

        console.log("=== JOB APPLICATION REMINDERS COMPLETED ===");
    } catch (error) {
        console.error("Error in checkPendingJobApplications:", error);
    }
};
const checkPendingTests = async () => {
    try {
        console.log("=== CHECKING PENDING TESTS ===");
        
        // Get all active tests
        const tests = await Test.find({}).sort({ createdAt: -1 });

        if (tests.length === 0) {
            console.log("No tests found");
            return;
        }

        console.log(`Found ${tests.length} tests to check`);

        // Group tests by department and year
        const testsByDeptYear = {};
        tests.forEach(test => {
            const key = `${test.department}-${test.year}`;
            if (!testsByDeptYear[key]) {
                testsByDeptYear[key] = [];
            }
            testsByDeptYear[key].push(test);
        });

        let remindersToSend = [];

        // Check each department/year combination
        for (const [deptYear, deptTests] of Object.entries(testsByDeptYear)) {
            const [department, year] = deptYear.split('-');
            
            // Get students for this department/year
            const students = await Student.find({
                department: department,
                year: year
            }).select('name email department year');

            console.log(`Checking ${students.length} students in ${department} ${year}`);

            // Check each student's test completion
            for (const student of students) {
                const pendingTests = [];

                for (const test of deptTests) {
                    // Check if student has taken this test
                    const testResult = await TestResult.findOne({
                        student: student._id,
                        test: test._id
                    });

                    if (!testResult) {
                        pendingTests.push(test);
                    }
                }

                // If student has pending tests
                if (pendingTests.length > 0) {
                    console.log(`Student ${student.name} has ${pendingTests.length} pending tests`);
                    
                    // Get admin info for this department
                    const Faculty = require('../models/Faculty');
                    const admin = await Faculty.findOne({ department: department });
                    
                    remindersToSend.push({
                        student: student,
                        tests: pendingTests,
                        adminName: admin ? admin.name : 'Faculty',
                        adminEmail: admin ? admin.email : null
                    });
                }
            }
        }

        console.log(`Sending ${remindersToSend.length} test reminders`);

        // Send reminder emails
        for (const reminder of remindersToSend) {
            try {
                const subject = `📝 Daily Test Reminder - ${reminder.tests.length} Pending Test${reminder.tests.length > 1 ? 's' : ''}`;
                const htmlContent = createTestReminderEmail(
                    reminder.student.name,
                    reminder.tests,
                    reminder.adminName,
                    reminder.adminEmail
                );

                const adminInfo = reminder.adminEmail ? {
                    name: reminder.adminName,
                    email: reminder.adminEmail
                } : null;

                await sendEmail([reminder.student.email], subject, htmlContent, '', adminInfo);
                console.log(`✅ Test reminder sent to ${reminder.student.email}`);
            } catch (error) {
                console.error(`❌ Failed to send test reminder to ${reminder.student.email}:`, error.message);
            }
        }

        console.log("=== TEST REMINDERS COMPLETED ===");
    } catch (error) {
        console.error("Error in checkPendingTests:", error);
    }
};

// Main reminder function that runs daily
const runDailyReminders = async () => {
    console.log(`\n🔔 Running daily reminders at ${new Date().toLocaleString()}`);
    
    try {
        await checkPendingStudyMaterials();
        await checkPendingTests();
        await checkPendingJobApplications();
        console.log("✅ Daily reminders completed successfully\n");
    } catch (error) {
        console.error("❌ Error in daily reminders:", error);
    }
};

// Initialize cron jobs
const initializeReminderSystem = () => {
    console.log("🚀 Initializing reminder system...");
    
    // Run daily at 9:00 AM
    cron.schedule('0 9 * * *', runDailyReminders, {
        scheduled: true,
        timezone: "Asia/Kolkata" // Adjust timezone as needed
    });

    // Optional: Run daily at 6:00 PM as well for evening reminders
    cron.schedule('0 18 * * *', runDailyReminders, {
        scheduled: true,
        timezone: "Asia/Kolkata"
    });

    console.log("✅ Reminder system initialized");
    console.log("📅 Scheduled: Daily at 9:00 AM and 6:00 PM (IST)");
    
    // Optional: Run once immediately for testing (comment out in production)
    // setTimeout(runDailyReminders, 5000); // Run after 5 seconds for testing
};

module.exports = {
    initializeReminderSystem,
    runDailyReminders,
    checkPendingStudyMaterials,
    checkPendingTests,
    checkPendingJobApplications
};