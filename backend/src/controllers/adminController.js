
const Test = require('../models/Test');
const StudyMaterial = require('../models/StudyMaterial');
const StudyLog = require('../models/StudyLog');
const TestResult = require('../models/TestResult');
const Student = require('../models/Student');
const Week = require('../models/Week');
const Faculty = require('../models/Faculty');
const bcrypt = require('bcryptjs');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { sendMaterialNotification, sendTestNotification } = require('../utils/emailService');

// @desc    Create a new test
// @route   POST /api/admin/tests
// @access  Private (Admin)
const createTest = async (req, res) => {
    try {
        const { title, week, questions, duration, passMarks, department, year } = req.body;

        const test = await Test.create({
            title,
            week,
            questions,
            duration,
            passMarks,
            department, // Admin chooses dept or defaults to their own
            year,
            createdBy: req.user._id
        });

        // Respond immediately to the frontend
        res.status(201).json(test);

        // Send email notifications asynchronously (don't wait for completion)
        setImmediate(async () => {
            try {
                // Convert year format: "2" -> "2nd Year", "1" -> "1st Year", etc.
                let searchYear = year || req.user.year;
                if (searchYear && !searchYear.includes('Year')) {
                    const yearNum = parseInt(searchYear);
                    const suffix = yearNum === 1 ? 'st' : yearNum === 2 ? 'nd' : yearNum === 3 ? 'rd' : 'th';
                    searchYear = `${yearNum}${suffix} Year`;
                }

                const students = await Student.find({
                    department: department || req.user.department,
                    year: searchYear
                }).select('name email');

                if (students.length > 0) {
                    const emailResult = await sendTestNotification(
                        students,
                        test.title,
                        department || req.user.department,
                        req.user.name,
                        test.duration,
                        test.passMarks,
                        req.user.email // Pass admin's email
                    );
                }
            } catch (emailError) {
                console.error("Error sending async test notifications:", emailError);
                // Email failure doesn't affect the test creation since it's already completed
            }
        });
    } catch (error) {
        console.error("Error creating test:", error);
        res.status(500).json({ message: error.message || 'Error creating test' });
    }
};

// @desc    Get all tests queries by department/year
// @route   GET /api/admin/tests
// @access  Private (Admin)
const getTests = async (req, res) => {
    try {
        const query = {
            $or: [
                { department: req.user.department },
                { department: 'Common' }
            ]
        };
        // Optional: Filter by year if needed, or return all for the dept
        // if (req.query.year) query.year = req.query.year; 

        const tests = await Test.find(query).sort({ createdAt: -1 });

        res.json(tests);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching tests' });
    }
};

// @desc    Update a test
// @route   PUT /api/admin/tests/:id
// @access  Private (Admin)
const updateTest = async (req, res) => {
    try {
        const test = await Test.findById(req.params.id);

        if (!test) {
            res.status(404);
            throw new Error('Test not found');
        }

        // Ensure user belongs to the same department or is super admin (logic depends on requirements, assuming dept check)
        if (test.department !== req.user.department && test.department !== 'Common') {
            res.status(401);
            throw new Error('Not authorized to update this test');
        }

        const updatedTest = await Test.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
        });

        res.json(updatedTest);
    } catch (error) {
        res.status(400).json({ message: error.message || 'Error updating test' });
    }
};

// @desc    Delete a test
// @route   DELETE /api/admin/tests/:id
// @access  Private (Admin)
const deleteTest = async (req, res) => {
    try {
        const test = await Test.findById(req.params.id);

        if (!test) {
            res.status(404);
            throw new Error('Test not found');
        }

        if (test.department !== req.user.department && test.department !== 'Common') {
            res.status(401);
            throw new Error('Not authorized to delete this test');
        }

        await test.deleteOne();
        res.json({ message: 'Test removed' });
    } catch (error) {
        res.status(500).json({ message: error.message || 'Error deleting test' });
    }
};

// @desc    Upload study material
// @route   POST /api/admin/materials
// @access  Private (Admin)
const uploadMaterial = async (req, res) => {
    try {
        // Ensure req.body exists to avoid destructuring error
        const body = req.body || {};
        const { title, type, week, department, year, duration, description } = body;

        // Frontend might send 'url' or 'link' for videos
        let link = body.link || body.url;

        // If a file was uploaded
        let files = [];
        let pages = null;
        
        if (req.file) {
            files.push({
                name: req.file.originalname,
                path: req.file.path
            });
            
            // Calculate PDF pages if it's a PDF file
            if (type === 'pdf' && req.file.mimetype === 'application/pdf') {
                try {
                    const dataBuffer = fs.readFileSync(req.file.path);
                    const pdfData = await pdfParse(dataBuffer);
                    pages = pdfData.numpages;
                } catch (pdfError) {
                    console.error("Error parsing PDF:", pdfError.message);
                    // Continue without page count
                }
            }
        } else if (link) {
            // For video links
            files.push({
                name: title || 'Video Link',
                path: link
            });
        }

        if (!title || (files.length === 0) || !type || !week) {
            res.status(400);
            throw new Error('Please provide all required fields: title, link/file, type, week');
        }

        const material = await StudyMaterial.create({
            title,
            description,
            files, // New structure
            type,
            week,
            duration: duration || null,
            pages: pages || null,
            department: department || req.user.department,
            year: year || req.user.year,
            uploadedBy: req.user._id
        });

        // Respond immediately to the frontend
        res.status(201).json(material);

        // Send email notifications asynchronously (don't wait for completion)
        setImmediate(async () => {
            try {
                // Convert year format: "2" -> "2nd Year", "1" -> "1st Year", etc.
                let searchYear = year || req.user.year;
                if (searchYear && !searchYear.includes('Year')) {
                    const yearNum = parseInt(searchYear);
                    const suffix = yearNum === 1 ? 'st' : yearNum === 2 ? 'nd' : yearNum === 3 ? 'rd' : 'th';
                    searchYear = `${yearNum}${suffix} Year`;
                }

                const students = await Student.find({
                    department: department || req.user.department,
                    year: searchYear
                }).select('name email');

                if (students.length > 0) {
                    const emailResult = await sendMaterialNotification(
                        students,
                        material.title,
                        material.week,
                        department || req.user.department,
                        req.user.name,
                        req.user.email // Pass admin's email
                    );
                }
            } catch (emailError) {
                console.error("Error sending async material notifications:", emailError);
                // Email failure doesn't affect the material upload since it's already completed
            }
        });
    } catch (error) {
        console.error("Error uploading material:", error);
        res.status(500).json({ message: error.message || 'Server error uploading material' });
    }
};

// @desc    Update a study material
// @route   PUT /api/admin/materials/:id
// @access  Private (Admin)
const updateMaterial = async (req, res) => {
    try {
        const material = await StudyMaterial.findById(req.params.id);

        if (!material) {
            return res.status(404).json({ message: 'Material not found' });
        }

        const { title, description, url } = req.body;

        if (title) material.title = title;
        if (description !== undefined) material.description = description;
        
        // Handle URL update for video materials
        if (url) {
            // If material has files array, update it
            if (material.files && material.files.length > 0) {
                material.files[0].path = url;
                material.files[0].name = title || material.files[0].name;
            } 
            // If material has link field (legacy), update it
            else if (material.link !== undefined) {
                material.link = url;
            }
            // Otherwise create files array
            else {
                material.files = [{ name: title || 'Link', path: url }];
            }
        }

        const updatedMaterial = await material.save();
        res.json(updatedMaterial);
    } catch (error) {
        res.status(500).json({ message: error.message || 'Error updating material' });
    }
};

// @desc    Delete a study material
// @route   DELETE /api/admin/materials/:id
// @access  Private (Admin)
const deleteMaterial = async (req, res) => {
    try {
        const material = await StudyMaterial.findById(req.params.id);

        if (!material) {
            return res.status(404).json({ message: 'Material not found' });
        }

        // Optional: Delete associated files from filesystem
        // if (material.files && material.files.length > 0) {
        //     material.files.forEach(file => {
        //         if (file.path && !file.path.startsWith('http')) {
        //             fs.unlink(file.path, (err) => {
        //                 if (err) console.error('Error deleting file:', err);
        //             });
        //         }
        //     });
        // }

        await StudyMaterial.findByIdAndDelete(req.params.id);
        res.json({ message: 'Material deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message || 'Error deleting material' });
    }
};

// @desc    Get student progress (Study Hours & Test Results)
// @route   GET /api/admin/students/progress
// @access  Private (Admin)
const getStudentProgress = async (req, res) => {
    try {
        // Get students in admin's department
        const query = { department: req.user.department };
        
        // Only filter by year if it's explicitly set and not empty
        if (req.user.year && req.user.year !== 'all') {
            query.year = req.user.year;
        }
        
        const students = await Student.find(query).select('-password').lean();

        if (students.length === 0) {
            return res.json([]);
        }

        const studentIds = students.map(s => s._id);

        // Fetch ALL logs and results at once (much faster than individual queries)
        const [allLogs, allResults] = await Promise.all([
            StudyLog.find({ student: { $in: studentIds } }).lean(),
            TestResult.find({ student: { $in: studentIds } }).lean()
        ]);

        // Group logs and results by student ID for quick lookup
        const logsByStudent = {};
        const resultsByStudent = {};

        allLogs.forEach(log => {
            const studentId = log.student.toString();
            if (!logsByStudent[studentId]) logsByStudent[studentId] = [];
            logsByStudent[studentId].push(log);
        });

        allResults.forEach(result => {
            const studentId = result.student.toString();
            if (!resultsByStudent[studentId]) resultsByStudent[studentId] = [];
            resultsByStudent[studentId].push(result);
        });

        // Build progress data using pre-fetched data
        const progressData = students.map(student => {
            const studentId = student._id.toString();
            const logs = logsByStudent[studentId] || [];
            const results = resultsByStudent[studentId] || [];

            const totalMinutes = logs.reduce((acc, log) => acc + log.activeMinutes, 0);
            const testsPassed = results.filter(r => r.status === 'pass').length;

            return {
                studentId: student._id.toString(),
                name: student.name,
                registerNumber: student.regNo,
                email: student.email,
                department: student.department,
                year: student.year,
                resume: student.resume, // Include resume path
                interestedInPlacement: student.interestedInPlacement,
                totalStudyHours: (totalMinutes / 60).toFixed(1),
                testsAttended: results.length,
                testsPassed
            };
        });

        res.json(progressData);
    } catch (error) {
        console.error("Error in getStudentProgress:", error);
        res.status(500).json({ message: "Failed to fetch student progress", error: error.message });
    }
};

// @desc    Upload students from CSV
// @route   POST /api/admin/upload-students
// @access  Private (Admin)
const uploadStudentsFromCSV = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Please upload a CSV file' });
    }

    const students = [];
    const results = {
        inserted: 0,
        skipped: 0,
        errors: []
    };
    const preview = [];

    // Map to keep track of seen emails/regnos in this file to avoid duplicate processing
    const processedEmails = new Set();
    const processedRegnos = new Set();

    fs.createReadStream(req.file.path)
        .pipe(csv({
            mapHeaders: ({ header }) => header.trim().replace(/^\uFEFF/, '').toLowerCase()
        }))
        .on('data', (row) => students.push(row))
        .on('end', async () => {
            const logPath = path.join(process.cwd(), 'csv_upload_debug.log');
            fs.appendFileSync(logPath, `\n\nStarting upload session at ${new Date().toISOString()}\n`);
            fs.appendFileSync(logPath, `Admin Department: ${req.user.department}\n`);

            for (let i = 0; i < students.length; i++) {
                const row = students[i];
                const rowNum = i + 1;

                fs.appendFileSync(logPath, `\n--- Processing Row ${rowNum} START ---\n`);

                try {
                    // Skip empty rows
                    if (!Object.values(row).some(x => x && x.trim())) {
                        fs.appendFileSync(logPath, `Row ${rowNum} SKIPPED: Empty row.\n`);
                        continue;
                    }

                    // Map variations to standard names
                    const getVal = (keys) => {
                        for (const key of keys) {
                            if (row[key]) return row[key].toString().trim();
                        }
                        return null;
                    };

                    const name = getVal(['name', 'full name', 'student name']);
                    const email = getVal(['email', 'email id', 'emailaddress'])?.toLowerCase();
                    const regNo = getVal(['regno', 'reg no', 'register number', 'registration number', 'reg.no']);
                    const year = getVal(['year', 'academic year', 'current year']) || "3rd Year";
                    const interestedInPlacement = getVal(['interestedinplacement', 'placement interest', 'interested'])?.toLowerCase() === 'true';

                    // IMPORTANT: Force student into the admin's department to ensure they appear in their dashboard
                    const department = req.user.department;

                    fs.appendFileSync(logPath, `Row ${rowNum} Mapped Data: name=${name}, email=${email}, regno=${regNo}, dept=${department}\n`);

                    // Basic Validation
                    if (!name || !email || !regNo || !year) {
                        const errorMsg = `Missing fields. Found keys: ${Object.keys(row).join(',')}`;
                        fs.appendFileSync(logPath, `Row ${rowNum} ERROR: ${errorMsg}\n`);
                        results.errors.push({ row: rowNum, error: errorMsg });
                        continue;
                    }

                    // Check for internal duplicates in the CSV itself
                    if (processedEmails.has(email)) {
                        const errorMsg = `Duplicate email within CSV: ${email}`;
                        fs.appendFileSync(logPath, `Row ${rowNum} SKIPPED: ${errorMsg}\n`);
                        results.errors.push({ row: rowNum, error: errorMsg });
                        results.skipped++;
                        continue;
                    }
                    if (processedRegnos.has(regNo)) {
                        const errorMsg = `Duplicate registration number within CSV: ${regNo}`;
                        fs.appendFileSync(logPath, `Row ${rowNum} SKIPPED: ${errorMsg}\n`);
                        results.errors.push({ row: rowNum, error: errorMsg });
                        results.skipped++;
                        continue;
                    }

                    // Check for duplicates in DB
                    fs.appendFileSync(logPath, `Row ${rowNum}: Checking DB for ${email} or ${regNo}\n`);
                    const userExists = await Student.findOne({
                        $or: [
                            { email: email },
                            { regNo: regNo }
                        ]
                    });

                    if (userExists) {
                        results.skipped++;
                        fs.appendFileSync(logPath, `Row ${rowNum} SKIPPED: Duplicate in database\n`);
                        continue;
                    }

                    fs.appendFileSync(logPath, `Row ${rowNum}: Generating password hash...\n`);
                    const salt = await bcrypt.genSalt(10);
                    const hashedRegnoPassword = await bcrypt.hash(regNo, salt);

                    fs.appendFileSync(logPath, `Row ${rowNum}: Creating student in DB...\n`);
                    // Create Student
                    const newStudent = await Student.create({
                        name,
                        email,
                        password: hashedRegnoPassword,
                        role: 'student',
                        regNo,
                        department,
                        year,
                        interestedInPlacement
                    });

                    processedEmails.add(email);
                    processedRegnos.add(regNo);

                    fs.appendFileSync(logPath, `Row ${rowNum} SUCCESS: Created ${email}\n`);

                    results.inserted++;
                    if (preview.length < 5) {
                        preview.push({
                            name: newStudent.name,
                            email: newStudent.email,
                            registerNumber: newStudent.regNo,
                            department: newStudent.department
                        });
                    }
                } catch (err) {
                    fs.appendFileSync(logPath, `Row ${rowNum} CATCH ERROR: ${err.message}\n`);
                    console.error(`Error at row ${rowNum}:`, err);
                    results.errors.push({ row: rowNum, error: err.message });
                }
                fs.appendFileSync(logPath, `--- Processing Row ${rowNum} END ---\n`);
            }

            // File is kept in the uploads folder as per user request

            res.status(200).json({
                message: 'Processing complete',
                ...results,
                preview
            });
        });
};

// @desc    Get aggregated reports
// @route   GET /api/admin/reports
// @access  Private (Admin)
const getReports = async (req, res) => {
    try {
        // Get department filter from query params, default to admin's department
        const filterDepartment = req.query.department || req.user.department;
        const showAllDepartments = req.query.department === 'All Departments';
        
        // 1. Basic Stats
        const deptQuery = showAllDepartments ? {} : { department: filterDepartment };
        const totalStudents = await Student.countDocuments(deptQuery);

        const students = await Student.find(deptQuery);
        const studentIds = students.map(s => s._id);

        // Aggregating study hours
        const studyLogs = await StudyLog.find({ student: { $in: studentIds } });
        const totalMinutes = studyLogs.reduce((acc, log) => acc + log.activeMinutes, 0);
        const avgStudyHours = totalStudents > 0 ? (totalMinutes / 60 / totalStudents).toFixed(1) : 0;

        // Aggregating test results
        const testResults = await TestResult.find({ student: { $in: studentIds } });
        const totalTests = testResults.length;
        const passedTests = testResults.filter(r => r.status === 'pass').length;
        const avgPerformance = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

        // At-risk students (Simple logic: Avg Score < 50% or Study Hours < 2h/week - assuming 1 week context for now)
        // More robust: Calculate per student
        const studentStats = await Promise.all(students.map(async (student) => {
            const sLogs = studyLogs.filter(l => l.student.toString() === student._id.toString());
            const sResults = testResults.filter(r => r.student.toString() === student._id.toString());
            const sMinutes = sLogs.reduce((acc, log) => acc + log.activeMinutes, 0);
            const sPassed = sResults.filter(r => r.status === 'pass').length;
            const sScore = sResults.length > 0 ? (sPassed / sResults.length) * 100 : 0;
            return {
                id: student._id,
                name: student.name,
                dept: student.department,
                hours: sMinutes / 60,
                score: sScore
            };
        }));

        const atRiskCount = studentStats.filter(s => s.score < 50 || s.hours < 2).length;

        // 2. Department-wise Performance (For the chart)
        // Filter departments based on selection
        let allStudents, allResults, allLogs, depts;
        
        if (showAllDepartments) {
            allStudents = await Student.find({});
            allResults = await TestResult.find({});
            allLogs = await StudyLog.find({});
            depts = [...new Set(allStudents.map(s => s.department))];
        } else {
            // Show only the selected department
            allStudents = students;
            allResults = testResults;
            allLogs = studyLogs;
            depts = [filterDepartment];
        }

        const deptPerformance = depts.map(d => {
            const dStudents = allStudents.filter(s => s.department === d);
            const dStudentIds = dStudents.map(s => s._id.toString());
            const dResults = allResults.filter(r => dStudentIds.includes(r.student.toString()));
            const dLogs = allLogs.filter(l => dStudentIds.includes(l.student.toString()));

            const dPassed = dResults.filter(r => r.status === 'pass').length;
            const dScore = dResults.length > 0 ? Math.round((dPassed / dResults.length) * 100) : 0;

            const dMinutes = dLogs.reduce((acc, log) => acc + log.activeMinutes, 0);
            const dHours = dStudents.length > 0 ? (dMinutes / 60 / dStudents.length).toFixed(1) : 0;

            // Calculate attendance based on study activity (students with >0 study hours are considered "active")
            const activeStudents = dStudents.filter(s => {
                const sLogs = dLogs.filter(l => l.student.toString() === s._id.toString());
                const sMinutes = sLogs.reduce((acc, log) => acc + log.activeMinutes, 0);
                return sMinutes > 0;
            }).length;
            const dAttendance = dStudents.length > 0 ? Math.round((activeStudents / dStudents.length) * 100) : 0;

            return {
                name: d,
                students: dStudents.length,
                avgScore: dScore,
                studyHours: dHours,
                attendance: dAttendance,
                status: dScore > 75 ? 'Excellent' : dScore > 60 ? 'Good' : 'Average'
            };
        });

        // 3. Performance Distribution (Pie Chart)
        const distribution = {
            excellent: studentStats.filter(s => s.score >= 85).length,
            good: studentStats.filter(s => s.score >= 70 && s.score < 85).length,
            average: studentStats.filter(s => s.score >= 50 && s.score < 70).length,
            atRisk: studentStats.filter(s => s.score < 50).length
        };

        res.json({
            stats: {
                totalStudents,
                avgPerformance: `${avgPerformance}%`,
                avgStudyHours: `${avgStudyHours}h`,
                atRiskStudents: atRiskCount
            },
            deptPerformance,
            distribution: [
                { name: 'Excellent (>85%)', value: distribution.excellent, color: '#10b981' },
                { name: 'Good (70-85%)', value: distribution.good, color: '#1e40af' },
                { name: 'Average (50-70%)', value: distribution.average, color: '#f59e0b' },
                { name: 'At Risk (<50%)', value: distribution.atRisk, color: '#ef4444' }
            ],
            studentDetails: studentStats.map(s => ({
                name: s.name,
                department: s.dept,
                studyHours: s.hours.toFixed(1),
                performanceScore: s.score.toFixed(1),
                status: s.score >= 85 ? 'Excellent' : s.score >= 70 ? 'Good' : s.score >= 50 ? 'Average' : 'At Risk'
            }))
        });

    } catch (error) {
        console.error("Error generating reports:", error);
        res.status(500).json({ message: 'Error generating reports' });
    }
};

// @desc    Create a new week
// @route   POST /api/admin/weeks
// @access  Private (Admin)
const createWeek = async (req, res) => {
    try {
        const { weekNumber, startDate, endDate, department, year } = req.body;

        const finalDept = department || req.user.department;
        const finalYear = year || req.user.year;

        // Check if week already exists
        const existingWeek = await Week.findOne({
            weekNumber,
            department: finalDept,
            year: finalYear
        });

        if (existingWeek) {
            return res.status(400).json({ message: 'Week number already exists for this department and year' });
        }

        const week = await Week.create({
            weekNumber,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            department: finalDept,
            year: finalYear,
            createdBy: req.user._id
        });

        res.status(201).json(week);
    } catch (error) {
        console.error("Error creating week:", error);
        res.status(500).json({ message: 'Failed to create week', error: error.message });
    }
};

// @desc    Get all weeks for department/year
// @route   GET /api/admin/weeks
// @access  Private (Admin)
const getWeeks = async (req, res) => {
    try {
        const query = { department: req.user.department };
        
        if (req.user.year && req.user.year !== 'all') {
            query.year = req.user.year;
        }

        const weeks = await Week.find(query).sort({ weekNumber: 1 });
        res.json(weeks);
    } catch (error) {
        console.error("Error fetching weeks:", error);
        res.status(500).json({ message: 'Failed to fetch weeks', error: error.message });
    }
};

// @desc    Update a week
// @route   PUT /api/admin/weeks/:id
// @access  Private (Admin)
const updateWeek = async (req, res) => {
    try {
        const { weekNumber, startDate, endDate } = req.body;
        const week = await Week.findById(req.params.id);

        if (!week) {
            return res.status(404).json({ message: 'Week not found' });
        }

        // Check if updating to a week number that already exists
        if (weekNumber && weekNumber !== week.weekNumber) {
            const existingWeek = await Week.findOne({
                weekNumber,
                department: week.department,
                year: week.year,
                _id: { $ne: req.params.id }
            });

            if (existingWeek) {
                return res.status(400).json({ message: 'Week number already exists' });
            }
        }

        week.weekNumber = weekNumber || week.weekNumber;
        week.startDate = startDate ? new Date(startDate) : week.startDate;
        week.endDate = endDate ? new Date(endDate) : week.endDate;

        const updatedWeek = await week.save();
        res.json(updatedWeek);
    } catch (error) {
        console.error("Error updating week:", error);
        res.status(500).json({ message: 'Failed to update week', error: error.message });
    }
};

// @desc    Delete a week
// @route   DELETE /api/admin/weeks/:id
// @access  Private (Admin)
const deleteWeek = async (req, res) => {
    try {
        const week = await Week.findById(req.params.id);

        if (!week) {
            return res.status(404).json({ message: 'Week not found' });
        }

        // Check if week has materials
        const materials = await StudyMaterial.find({ week: week.weekNumber });
        if (materials.length > 0) {
            return res.status(400).json({ message: 'Cannot delete week with materials. Please delete materials first.' });
        }

        await Week.findByIdAndDelete(req.params.id);
        res.json({ message: 'Week deleted successfully' });
    } catch (error) {
        console.error("Error deleting week:", error);
        res.status(500).json({ message: 'Failed to delete week', error: error.message });
    }
};

// @desc    Update student details
// @route   PUT /api/admin/students/:id
// @access  Private (Admin)
const updateStudent = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Check if admin can update this student (same department)
        if (student.department !== req.user.department) {
            return res.status(403).json({ message: 'Not authorized to update this student' });
        }

        const { name, email, regNo, department, year, interestedInPlacement } = req.body;

        // Validate required fields
        if (!name || !email || !regNo) {
            return res.status(400).json({ message: 'Name, email, and register number are required' });
        }

        // Check for email uniqueness (excluding current student)
        if (email !== student.email) {
            const existingEmailStudent = await Student.findOne({ 
                email: email.toLowerCase(),
                _id: { $ne: req.params.id }
            });

            if (existingEmailStudent) {
                return res.status(400).json({ message: 'Email already exists' });
            }
        }

        // Check for register number uniqueness (excluding current student)
        if (regNo !== student.regNo) {
            const existingRegNoStudent = await Student.findOne({ 
                regNo: regNo.toUpperCase(),
                _id: { $ne: req.params.id }
            });

            if (existingRegNoStudent) {
                return res.status(400).json({ message: 'Register number already exists' });
            }
        }

        // Update student fields
        student.name = name.trim();
        student.email = email.toLowerCase().trim();
        student.regNo = regNo.toUpperCase().trim();
        
        if (department) student.department = department;
        if (year) student.year = year;
        if (interestedInPlacement !== undefined) student.interestedInPlacement = interestedInPlacement;

        const updatedStudent = await student.save();

        // Return updated student without password
        const { password, ...studentData } = updatedStudent.toObject();
        res.json(studentData);

    } catch (error) {
        console.error('Error updating student:', error);
        res.status(500).json({ message: error.message || 'Error updating student' });
    }
};

// @desc    Change admin password
// @route   PUT /api/admin/change-password
// @access  Private (Admin)
const changeAdminPassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;

        // Validate required fields
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ 
                message: 'All fields are required: currentPassword, newPassword, confirmPassword' 
            });
        }

        // Check if new password and confirm password match
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: 'New password and confirm password do not match' });
        }

        // Validate new password strength
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters long' });
        }

        // Get the admin user with password
        const admin = await Faculty.findById(req.user._id);

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, admin.password);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Check if new password is different from current password
        const isSamePassword = await bcrypt.compare(newPassword, admin.password);
        if (isSamePassword) {
            return res.status(400).json({ message: 'New password must be different from current password' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedNewPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        await Faculty.findByIdAndUpdate(req.user._id, {
            password: hashedNewPassword
        });

        res.json({ message: 'Password changed successfully' });

    } catch (error) {
        console.error('Error changing admin password:', error);
        res.status(500).json({ message: error.message || 'Error changing password' });
    }
};

// @desc    Create a new student
// @route   POST /api/admin/students
// @access  Private (Admin)
const createStudent = async (req, res) => {
    try {
        const { name, email, regNo, department, year, password, interestedInPlacement } = req.body;

        // Validate required fields
        if (!name || !email || !regNo || !department || !year || !password) {
            return res.status(400).json({ 
                message: 'All fields are required: name, email, regNo, department, year, password' 
            });
        }

        // Check if admin can create student in this department
        if (department !== req.user.department) {
            return res.status(403).json({ 
                message: 'Not authorized to create student in this department' 
            });
        }

        // Check if email already exists
        const existingEmailStudent = await Student.findOne({ 
            email: email.toLowerCase() 
        });

        if (existingEmailStudent) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        // Check if register number already exists
        const existingRegNoStudent = await Student.findOne({ 
            regNo: regNo.toUpperCase() 
        });

        if (existingRegNoStudent) {
            return res.status(400).json({ message: 'Register number already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create student
        const student = await Student.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            regNo: regNo.toUpperCase().trim(),
            department,
            year,
            password: hashedPassword,
            interestedInPlacement: interestedInPlacement || false,
            role: 'student'
        });

        // Return student without password
        const { password: _, ...studentData } = student.toObject();
        res.status(201).json(studentData);

    } catch (error) {
        console.error('Error creating student:', error);
        res.status(500).json({ message: error.message || 'Error creating student' });
    }
};

// @desc    Delete student
// @route   DELETE /api/admin/students/:id
// @access  Private (Admin)
const deleteStudent = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Check if admin can delete this student (same department)
        if (student.department !== req.user.department) {
            return res.status(403).json({ message: 'Not authorized to delete this student' });
        }

        // Delete related data first
        const deleteResults = await Promise.all([
            // Delete test results
            require('../models/TestResult').deleteMany({ student: req.params.id }),
            // Delete study logs
            require('../models/StudyLog').deleteMany({ student: req.params.id }),
            // Delete job applications
            require('../models/Application').deleteMany({ student: req.params.id })
        ]);

        // Delete the student
        const deletedStudent = await Student.findByIdAndDelete(req.params.id);

        res.json({ message: 'Student and related data deleted successfully' });

    } catch (error) {
        console.error('Error deleting student:', error);
        res.status(500).json({ message: error.message || 'Error deleting student' });
    }
};

module.exports = {
    createTest,
    getTests,
    updateTest,
    deleteTest,
    uploadMaterial,
    updateMaterial,
    deleteMaterial,
    getStudentProgress,
    uploadStudentsFromCSV,
    updateStudent,
    createStudent,
    deleteStudent,
    changeAdminPassword,
    getReports,
    createWeek,
    getWeeks,
    updateWeek,
    deleteWeek
};