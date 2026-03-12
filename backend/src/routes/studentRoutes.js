const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Routes requiring Student role (or Faculty for read-only access where appropriate)
router.use(protect);

// Shared routes (Student & Faculty)
router.get('/materials', authorize('student', 'faculty'), getMaterials);
router.get('/tests', authorize('student', 'faculty'), getTests);
router.get('/weeks', authorize('student', 'faculty'), getWeeks);

// Student-only routes
router.post('/test/submit', authorize('student'), submitTest);
router.get('/test-results', authorize('student'), getTestResults);
router.post('/study-log', authorize('student'), logStudyTime);
router.get('/stats', authorize('student'), getStudentStats);
router.get('/jobs', authorize('student'), getJobs);
router.post('/jobs/:id/apply', authorize('student'), applyToJob);
router.get('/applications', authorize('student'), getApplications);
router.get('/profile', authorize('student'), getProfile);
router.put('/profile', authorize('student'), upload.single('resume'), updateProfile);
module.exports = router;
