
const express = require('express');
const router = express.Router();
const {
    createJob,
    getApplications,
    getJobs,
    deleteJob,
    updateJob,
    getPlacementStudents,
    changePlacementPassword
} = require('../controllers/placementController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { checkPendingJobApplications } = require('../services/reminderService');

router.use(protect);
router.use(authorize('placementofficer')); // Placement Admin

router.post('/jobs', createJob);
router.get('/jobs', getJobs);
router.put('/jobs/:id', updateJob);
router.delete('/jobs/:id', deleteJob);
router.get('/applications', getApplications);
router.get('/applications/test', (req, res) => {
    res.json({ message: 'Applications endpoint is working', user: req.user?.name });
});
router.get('/students', getPlacementStudents);
router.put('/change-password', changePlacementPassword);

// Manual job application reminder trigger (for development/testing)
router.post('/send-job-reminders', async (req, res) => {
    try {
        await checkPendingJobApplications();
        res.json({ message: 'Job application reminders sent successfully' });
    } catch (error) {
        console.error('Error sending manual job application reminders:', error);
        res.status(500).json({ message: 'Error sending job application reminders', error: error.message });
    }
});

module.exports = router;
