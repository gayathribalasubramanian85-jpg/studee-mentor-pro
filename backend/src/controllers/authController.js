
const Faculty = require('../models/Faculty');
const Student = require('../models/Student');
const PlacementOfficer = require('../models/PlacementOfficer');
const generateToken = require('../utils/generateToken');
const bcrypt = require('bcryptjs');

// @desc    Auth user (Strict Role-Based Login)
// @route   POST /api/auth/login
// @access  Public
const authUser = async (req, res) => {
    const { email, password, role, department, year } = req.body;

    let user;
    if (role === 'student') {
        user = await Student.findOne({
            $or: [
                { email: email },
                { regNo: email }
            ]
        });
    } else if (role === 'admin') {
        // Faculty login
        user = await Faculty.findOne({ email });
    } else if (role === 'placement') {
        user = await PlacementOfficer.findOne({ email });
    } else {
        res.status(400);
        throw new Error('Invalid role specified');
    }

    if (!user) {
        res.status(401);
        throw new Error(`User not found in the ${role} portal. Ensure you are using the correct login form.`);
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
        res.status(401);
        throw new Error('Invalid email or password');
    }

    // Role verification (ensure the user's role in DB matches the portal expectation)
    const dbRole = user.role;
    const isRoleMatch = (role === 'student' && dbRole === 'student') ||
        (role === 'admin' && dbRole === 'faculty') ||
        (role === 'placement' && dbRole === 'placementofficer');

    if (!isRoleMatch) {
        res.status(401);
        throw new Error(`Role mismatch. Your account is registered as ${dbRole}, not ${role}.`);
    }

    // Department validation - Only enforce if department is provided in request
    if (department && user.department && user.department.trim() !== department.trim()) {
        res.status(401);
        throw new Error('Wrong department');
    }

    // Year validation for Students if provided
    if (role === 'student' && year && user.year && user.year !== year) {
        res.status(401);
        throw new Error(`Year mismatch. You are registered in ${user.year}.`);
    }

    // Prepare response data
    const responseData = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        year: user.year,
        token: generateToken(user._id, {
            department: role === 'admin' ? department : user.department,
            year: role === 'admin' ? year : user.year
        }),
    };

    // Include selected department and year for session management
    if (role === 'admin') {
        responseData.selectedDepartment = department;
        responseData.selectedYear = year;
    }

    res.json(responseData);
};

// @desc    Register a Student
// @route   POST /api/auth/register/student
// @access  Public
const registerStudent = async (req, res) => {
    const { name, email, password, regNo, department, year, interestedInPlacement } = req.body;

    const userExists = await Student.findOne({ $or: [{ email }, { regNo }] });
    if (userExists) {
        res.status(400);
        throw new Error('Student with this email or Register Number already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const student = await Student.create({
        name,
        email,
        password: hashedPassword,
        regNo,
        department,
        year,
        interestedInPlacement: interestedInPlacement || false
    });

    res.status(201).json({
        _id: student._id,
        name: student.name,
        email: student.email,
        role: student.role,
        token: generateToken(student._id),
    });
};

// @desc    Register a Faculty
// @route   POST /api/auth/register/faculty
// @access  Public
const registerFaculty = async (req, res) => {
    const { name, email, password, department } = req.body;

    const userExists = await Faculty.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error('Faculty with this email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const faculty = await Faculty.create({
        name,
        email,
        password: hashedPassword,
        department
    });

    res.status(201).json({
        _id: faculty._id,
        name: faculty.name,
        email: faculty.email,
        role: faculty.role,
        token: generateToken(faculty._id),
    });
};

// @desc    Register a Placement Officer
// @route   POST /api/auth/register/placement
// @access  Public
const registerPlacementOfficer = async (req, res) => {
    const { name, email, password } = req.body;

    const userExists = await PlacementOfficer.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error('Placement Officer with this email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const officer = await PlacementOfficer.create({
        name,
        email,
        password: hashedPassword
    });

    res.status(201).json({
        _id: officer._id,
        name: officer.name,
        email: officer.email,
        role: officer.role,
        token: generateToken(officer._id),
    });
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
    let user = await Student.findById(req.user._id);
    if (!user) user = await Faculty.findById(req.user._id);
    if (!user) user = await PlacementOfficer.findById(req.user._id);

    if (user) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
};

module.exports = {
    authUser,
    registerStudent,
    registerFaculty,
    registerPlacementOfficer,
    getUserProfile
};
