
const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const PlacementOfficer = require('../models/PlacementOfficer');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            let user = await Student.findById(decoded.id).select('-password');
            if (!user) user = await Faculty.findById(decoded.id).select('-password');
            if (!user) user = await PlacementOfficer.findById(decoded.id).select('-password');

            if (user) {
                // Attach session-specific department and year from token
                // For Faculty, these come from their login selection
                req.user = {
                    ...user.toObject(),
                    department: decoded.department || user.department,
                    year: decoded.year || user.year
                };
                next();
            } else {
                res.status(401);
                throw new Error('Not authorized, user not found');
            }
        } catch (error) {
            console.error(error);
            res.status(401);
            throw new Error('Not authorized, token failed');
        }
    }

    if (!token) {
        res.status(401);
        throw new Error('Not authorized, no token');
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            res.status(403);
            throw new Error(`User role ${req.user.role} is not authorized to access this route`);
        }
        next();
    };
};

module.exports = { protect, authorize };
