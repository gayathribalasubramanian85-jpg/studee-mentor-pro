
const StudyMaterial = require('../models/StudyMaterial');
const Test = require('../models/Test');
const TestResult = require('../models/TestResult');
const StudyLog = require('../models/StudyLog');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Student = require('../models/Student');
const Week = require('../models/Week');

// @desc    Get study materials for student's department/year
// @route   GET /api/student/materials
// @access  Private (Student)
const getMaterials = async (req, res) => {
    // Filter by student's department and year
    const materials = await StudyMaterial.find({
        department: req.user.department,
        year: req.user.year
    });
    res.json(materials);
};

// @desc    Get active tests
// @route   GET /api/student/tests
// @access  Private (Student)
const getTests = async (req, res) => {
    const tests = await Test.find({
        department: req.user.department,
        year: req.user.year,
        isActive: true
    });
    res.json(tests);
};

// @desc    Submit test result
// @route   POST /api/student/test/submit
// @access  Private (Student)
const submitTest = async (req, res) => {
    const { testId, score, totalMarks, logs, malpracticeFlags } = req.body;

    // Calculate pass/fail status based on test pass marks
    const test = await Test.findById(testId);
    if (!test) {
        res.status(404);
        throw new Error('Test not found');
    }

    const status = Number(score) >= Number(test.passMarks) ? 'pass' : 'fail';

    const result = await TestResult.create({
        student: req.user._id,
        studentName: req.user.name,
        regNo: req.user.regNo, // Assuming regNo exists on user model
        test: testId,
        score,
        totalMarks,
        status,
        logs: logs || [], // Ensure logs are saved if provided, else empty array
        malpracticeFlags
    });

    res.status(201).json(result);
};

// @desc    Log study time
// @route   POST /api/student/study-log
// @access  Private (Student)
const logStudyTime = async (req, res) => {
    const { date, minutes, session } = req.body; // session = { startTime, endTime, duration }

    // Find if log exists for today
    let log = await StudyLog.findOne({ student: req.user._id, date });

    if (log) {
        log.activeMinutes += minutes;
        if (session) log.sessions.push(session);
        await log.save();
    } else {
        log = await StudyLog.create({
            student: req.user._id,
            date,
            activeMinutes: minutes,
            sessions: session ? [session] : []
        });
    }

    res.json(log);
};

// @desc    Get student stats (dashboard)
// @route   GET /api/student/stats
// @access  Private (Student)
const getStudentStats = async (req, res) => {
    // Get total study hours
    const logs = await StudyLog.find({ student: req.user._id });
    const totalMinutes = logs.reduce((acc, log) => acc + log.activeMinutes, 0);
    const totalHours = (totalMinutes / 60).toFixed(1);

    // Get test pass rate
    const results = await TestResult.find({ student: req.user._id });
    const passed = results.filter(r => r.status === 'pass').length;
    const passRate = results.length > 0 ? ((passed / results.length) * 100).toFixed(0) : 0;

    res.json({
        studyHours: totalHours,
        testsAttended: results.length,
        passRate: passRate + '%'
    });
};

// @desc    Get all jobs for students
// @route   GET /api/student/jobs
// @access  Private (Student)
const getJobs = async (req, res) => {
    try {
        const jobs = await Job.find({}).sort({ createdAt: -1 });
        res.json(jobs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching jobs' });
    }
};

// @desc    Apply for a job
// @route   POST /api/student/jobs/:id/apply
// @access  Private (Student)
const applyToJob = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) {
            res.status(404);
            throw new Error('Job not found');
        }

        // Check if already applied
        const existingApplication = await Application.findOne({
            student: req.user._id,
            placement: req.params.id
        });

        if (existingApplication) {
            res.status(400);
            throw new Error('Already applied for this job');
        }

        const application = await Application.create({
            student: req.user._id,
            placement: req.params.id,
            studentName: req.user.name,
            studentRegNo: req.user.regNo,
            studentYear: req.user.year,
            studentDept: req.user.department,
            companyName: job.companyName,
            status: 'applied'
        });

        res.status(201).json(application);
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message || 'Error applying for job' });
    }
};

const getProfile = async (req, res) => {
    const student = await Student.findById(req.user._id).select('-password');
    if (!student) {
        return res.status(404).json({ message: 'Student not found' });
    }
    res.json(student);
};

const updateProfile = async (req, res) => {
    const student = await Student.findById(req.user._id);

    if (!student) {
        return res.status(404).json({ message: 'Student not found' });
    }

    const {
        name,
        department,
        year,
        semester,
        cgpa,
        backlogs,
        attendance,
        percentage,
        skills,
        interestedInPlacement
    } = req.body;

    student.name = name || student.name;
    student.department = department || student.department;
    student.year = year || student.year;
    student.semester = semester || student.semester;

    // Parse numeric and boolean values from FormData (which sends everything as strings)
    if (cgpa !== undefined) student.cgpa = parseFloat(cgpa);
    if (backlogs !== undefined) student.backlogs = parseInt(backlogs);
    if (attendance !== undefined) student.attendance = parseFloat(attendance);
    if (percentage !== undefined) student.percentage = parseFloat(percentage);

    if (interestedInPlacement !== undefined) {
        student.interestedInPlacement = interestedInPlacement === 'true' || interestedInPlacement === true;
    }

    if (skills) {
        // Handle skills from FormData - can be array or indexed object
        if (Array.isArray(skills)) {
            student.skills = skills.filter(skill => skill && skill.trim());
        } else if (typeof skills === 'string') {
            // If it's a single string, split by comma
            student.skills = skills.split(',').map(s => s.trim()).filter(s => s);
        } else if (typeof skills === 'object') {
            // Handle indexed object from FormData (skills[0], skills[1], etc.)
            const skillsArray = Object.values(skills).filter(skill => skill && skill.trim());
            student.skills = skillsArray;
        }
    }

    if (req.file) {
        student.resume = req.file.path;
    }

    const updatedStudent = await student.save();
    res.json(updatedStudent);
};

// @desc    Get weeks for student's department/year
// @route   GET /api/student/weeks
// @access  Private (Student)
const getWeeks = async (req, res) => {
    try {
        const query = { department: req.user.department };
        
        if (req.user.year && req.user.year !== 'all') {
            query.year = req.user.year;
        }

        const weeks = await Week.find(query).sort({ weekNumber: 1 });
        res.json(weeks);
    } catch (error) {
        console.error("Error fetching weeks for student:", error);
        res.status(500).json({ message: 'Failed to fetch weeks', error: error.message });
    }
};

// @desc    Get student's test results
// @route   GET /api/student/test-results
// @access  Private (Student)
const getTestResults = async (req, res) => {
    try {
        const results = await TestResult.find({ student: req.user._id })
            .populate('test', 'title duration')
            .sort({ createdAt: -1 });
        res.json(results);
    } catch (error) {
        console.error("Error fetching test results:", error);
        res.status(500).json({ message: 'Failed to fetch test results', error: error.message });
    }
};

// @desc    Get student's applications
// @route   GET /api/student/applications
// @access  Private (Student)
const getApplications = async (req, res) => {
    try {
        const applications = await Application.find({ student: req.user._id })
            .populate('placement', 'companyName role ctc location deadline')
            .sort({ createdAt: -1 });
        
        res.json(applications);
    } catch (error) {
        console.error('Error fetching applications:', error);
        res.status(500).json({ message: 'Failed to fetch applications' });
    }
};

module.exports = {
    getMaterials,
    getTests,
    submitTest,
    logStudyTime,
    getStudentStats,
    getJobs,
    applyToJob,
    getApplications,
    getProfile,
    updateProfile,
    getWeeks,
    getTestResults
};
