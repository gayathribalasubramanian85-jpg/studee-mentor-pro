
const Job = require('../models/Job');
const Application = require('../models/Application');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const PlacementOfficer = require('../models/PlacementOfficer');
const { sendPlacementNotification } = require('../utils/emailService');

// @desc    Create a new job posting
// @route   POST /api/placement/jobs
// @access  Private (Placement)
const createJob = async (req, res) => {
    try {
        const { companyName, role, description, ctc, location, applyLink, deadline, eligibleDepartments, criteria } = req.body;

        const job = await Job.create({
            companyName,
            role,
            description,
            ctc,
            location,
            applyLink,
            deadline,
            eligibleDepartments,
            criteria,
            postedBy: req.user._id
        });

        // Respond immediately to the frontend
        res.status(201).json(job);

        // Send email notifications to eligible students asynchronously
        setImmediate(async () => {
            try {
                // Build query for eligible students
                let studentQuery = {
                    interestedInPlacement: true // Only students interested in placement
                };

                // Filter by eligible departments
                if (eligibleDepartments && eligibleDepartments.length > 0) {
                    studentQuery.department = { $in: eligibleDepartments };
                }

                // Apply criteria filters
                if (criteria) {
                    if (criteria.minCGPA && criteria.minCGPA > 0) {
                        studentQuery.cgpa = { $gte: criteria.minCGPA };
                    }
                    if (criteria.minPercentage && criteria.minPercentage > 0) {
                        studentQuery.percentage = { $gte: criteria.minPercentage };
                    }
                    if (criteria.minAttendance && criteria.minAttendance > 0) {
                        studentQuery.attendance = { $gte: criteria.minAttendance };
                    }
                    if (criteria.noBacklogs === true) {
                        studentQuery.backlogs = { $lte: 0 };
                    }
                }

                const eligibleStudents = await Student.find(studentQuery)
                    .select('name email department cgpa percentage attendance backlogs')
                    .lean();

                if (eligibleStudents.length > 0) {
                    const emailResult = await sendPlacementNotification(
                        eligibleStudents,
                        {
                            companyName: job.companyName,
                            role: job.role,
                            ctc: job.ctc,
                            location: job.location,
                            deadline: job.deadline
                        },
                        req.user.name,
                        req.user.email // Pass placement officer's email
                    );
                }
            } catch (emailError) {
                console.error("Error sending async placement notifications:", emailError);
                // Email failure doesn't affect the job creation since it's already completed
            }
        });

    } catch (error) {
        console.error("Error creating job:", error);
        res.status(500).json({ message: error.message || 'Error creating job' });
    }
};

// @desc    Get all applications
// @route   GET /api/placement/applications
// @access  Private (Placement)
const getApplications = async (req, res) => {
    try {
        // Get all applications without populate
        const applications = await Application.find({})
            .sort({ createdAt: -1 })
            .lean();

        if (applications.length === 0) {
            return res.json([]);
        }

        // Manually fetch related data
        const studentIds = applications.map(app => app.student);
        const jobIds = applications.map(app => app.placement);

        const [students, jobs] = await Promise.all([
            Student.find({ _id: { $in: studentIds } }).select('name regNo department email phone resume').lean(),
            Job.find({ _id: { $in: jobIds } }).select('companyName role ctc location deadline').lean()
        ]);

        // Create lookup maps
        const studentMap = {};
        students.forEach(s => { studentMap[s._id.toString()] = s; });
        
        const jobMap = {};
        jobs.forEach(j => { jobMap[j._id.toString()] = j; });

        // Combine the data
        const populatedApplications = applications.map(app => ({
            ...app,
            student: studentMap[app.student.toString()] || null,
            placement: jobMap[app.placement.toString()] || null
        }));

        res.json(populatedApplications);
    } catch (error) {
        console.error('Error fetching applications:', error);
        res.status(500).json({ 
            message: 'Failed to fetch applications', 
            error: error.message
        });
    }
};

// @desc    Check eligibility for a student (Helper/API)
// @route   POST /api/placement/eligibility-check (Internal/Debug)
// ...logic mostly handled in Student module when listing jobs or creating logic engine



// @desc    Get all jobs
// @route   GET /api/placement/jobs
// @access  Private (Placement)
const getJobs = async (req, res) => {
    try {
        const jobs = await Job.find({}).sort({ createdAt: -1 });
        res.json(jobs);
    } catch (error) {
        console.error('Error fetching jobs:', error);
        res.status(500).json({ message: 'Failed to fetch jobs', error: error.message });
    }
};

// @desc    Delete a job
// @route   DELETE /api/placement/jobs/:id
// @access  Private (Placement)
const deleteJob = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Validate ObjectId format
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: 'Invalid job ID format' });
        }

        const job = await Job.findById(id);

        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        await Job.findByIdAndDelete(id);
        res.json({ message: 'Job deleted successfully' });
    } catch (error) {
        console.error('Error deleting job:', error);
        res.status(500).json({ message: 'Failed to delete job', error: error.message });
    }
};

// @desc    Update a job
// @route   PUT /api/placement/jobs/:id
// @access  Private (Placement)
const updateJob = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Validate ObjectId format
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ 
                message: 'Invalid job ID format. Please refresh the page and try again.'
            });
        }

        const job = await Job.findById(id);

        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        const { companyName, role, description, ctc, location, applyLink, deadline, eligibleDepartments, criteria } = req.body;

        job.companyName = companyName || job.companyName;
        job.role = role || job.role;
        job.description = description !== undefined ? description : job.description;
        job.ctc = ctc || job.ctc;
        job.location = location || job.location;
        job.applyLink = applyLink || job.applyLink;
        job.deadline = deadline || job.deadline;
        job.eligibleDepartments = eligibleDepartments || job.eligibleDepartments;
        job.criteria = criteria || job.criteria;

        const updatedJob = await job.save();
        res.json(updatedJob);
    } catch (error) {
        console.error('Error updating job:', error);
        res.status(500).json({ message: 'Failed to update job', error: error.message });
    }
};

// @desc    Get all students for placement tracking
// @route   GET /api/placement/students
// @access  Private (Placement)
const getPlacementStudents = async (req, res) => {
    try {
        // Use MongoDB aggregation for better performance
        const TestResult = require('../models/TestResult');
        
        const studentsWithTestScores = await Student.aggregate([
            {
                $match: { role: 'student' }
            },
            {
                $lookup: {
                    from: 'testresults',
                    localField: '_id',
                    foreignField: 'student',
                    as: 'testResults'
                }
            },
            {
                $addFields: {
                    avgTestScore: {
                        $cond: {
                            if: { $gt: [{ $size: '$testResults' }, 0] },
                            then: {
                                $round: [
                                    {
                                        $avg: {
                                            $map: {
                                                input: '$testResults',
                                                as: 'result',
                                                in: {
                                                    $multiply: [
                                                        { $divide: ['$$result.score', '$$result.totalMarks'] },
                                                        100
                                                    ]
                                                }
                                            }
                                        }
                                    },
                                    0
                                ]
                            },
                            else: 0
                        }
                    },
                    totalTests: { $size: '$testResults' },
                    passedTests: {
                        $size: {
                            $filter: {
                                input: '$testResults',
                                as: 'result',
                                cond: { $eq: ['$$result.status', 'pass'] }
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    name: 1,
                    regNo: 1,
                    department: 1,
                    year: 1,
                    cgpa: 1,
                    backlogs: 1,
                    percentage: 1,
                    interestedInPlacement: 1,
                    avgTestScore: 1,
                    totalTests: 1,
                    passedTests: 1
                }
            },
            {
                $sort: { regNo: 1 }
            }
        ]);

        res.json(studentsWithTestScores);
    } catch (error) {
        console.error("Error fetching placement students:", error);
        res.status(500).json({ message: 'Error fetching students data' });
    }
};

// @desc    Change placement officer password
// @route   PUT /api/placement/change-password
// @access  Private (Placement Officer)
const changePlacementPassword = async (req, res) => {
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

        // Get the placement officer with password
        const placementOfficer = await PlacementOfficer.findById(req.user._id);

        if (!placementOfficer) {
            return res.status(404).json({ message: 'Placement officer not found' });
        }

        // Verify current password
        const bcrypt = require('bcryptjs');
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, placementOfficer.password);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Check if new password is different from current password
        const isSamePassword = await bcrypt.compare(newPassword, placementOfficer.password);
        if (isSamePassword) {
            return res.status(400).json({ message: 'New password must be different from current password' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedNewPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        await PlacementOfficer.findByIdAndUpdate(req.user._id, {
            password: hashedNewPassword
        });

        res.json({ message: 'Password changed successfully' });

    } catch (error) {
        console.error('Error changing placement officer password:', error);
        res.status(500).json({ message: error.message || 'Error changing password' });
    }
};

module.exports = {
    createJob,
    getApplications,
    getJobs,
    deleteJob,
    updateJob,
    getPlacementStudents,
    changePlacementPassword
};
