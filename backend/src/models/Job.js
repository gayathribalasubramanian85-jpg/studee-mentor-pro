
const mongoose = require('mongoose');

const jobSchema = mongoose.Schema(
    {
        companyName: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            required: true,
        },
        description: {
            type: String,
        },
        ctc: {
            type: String, // e.g., "10 LPA"
        },
        location: {
            type: String,
        },
        applyLink: {
            type: String,
        },
        deadline: {
            type: Date,
        },
        eligibleDepartments: [{
            type: String
        }],
        criteria: {
            minCGPA: { type: Number, default: 0 },
            minPercentage: { type: Number, default: 0 },
            minAttendance: { type: Number, default: 0 },
            noBacklogs: { type: Boolean, default: false }
        },
        postedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

const Job = mongoose.model('Job', jobSchema);

module.exports = Job;
