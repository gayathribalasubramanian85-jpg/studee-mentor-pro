const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { runDailyReminders } = require('../services/reminderService');

router.use(protect);
router.use(authorize('faculty')); // Dept Admin

const upload = require('../middleware/uploadMiddleware');

router.post('/tests', createTest);
router.get('/tests', getTests);
router.put('/tests/:id', updateTest);
router.delete('/tests/:id', deleteTest);
router.post('/materials', upload.single('file'), uploadMaterial);
router.put('/materials/:id', updateMaterial);
router.delete('/materials/:id', deleteMaterial);
router.get('/students/progress', getStudentProgress);
router.post('/students', createStudent);
router.put('/students/:id', updateStudent);
router.delete('/students/:id', deleteStudent);
router.put('/change-password', changeAdminPassword);
router.post('/upload-students', upload.single('file'), uploadStudentsFromCSV);
router.get('/reports', getReports);

// Week management routes
router.post('/weeks', createWeek);
router.get('/weeks', getWeeks);
router.put('/weeks/:id', updateWeek);
router.delete('/weeks/:id', deleteWeek);

// Manual reminder testing (for development/testing)
router.post('/send-reminders', async (req, res) => {
    try {
        await runDailyReminders();
        res.json({ message: 'Reminders sent successfully' });
    } catch (error) {
        console.error('Error sending manual reminders:', error);
        res.status(500).json({ message: 'Error sending reminders', error: error.message });
    }
});

module.exports = router;