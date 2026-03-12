
const mongoose = require('mongoose');

const applicationSchema = mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        placement: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Job',
            required: true,
        },
        studentName: String,
        studentRegNo: String,
        studentYear: String,
        studentDept: String,
        companyName: String,
        status: {
            type: String,
            enum: ['applied', 'shortlisted', 'rejected', 'selected'],
            default: 'applied',
        },
    },
    {
        timestamps: true,
    }
);

// Ensure unique application per student per job/placement
applicationSchema.index({ student: 1, placement: 1 }, { unique: true });

const Application = mongoose.model('Application', applicationSchema);

module.exports = Application;
