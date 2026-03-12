
const express = require('express');
const router = express.Router();
const {
    authUser,
    registerFaculty,
    registerStudent,
    registerPlacementOfficer,
    getUserProfile
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/login', authUser);
router.post('/register/faculty', registerFaculty);
router.post('/register/student', registerStudent);
router.post('/register/placement', registerPlacementOfficer);
router.get('/profile', protect, getUserProfile);

module.exports = router;
