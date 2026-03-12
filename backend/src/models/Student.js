
const mongoose = require('mongoose');

const studentSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        regNo: {
            type: String,
            required: true,
            unique: true,
        },
        department: {
            type: String,
            required: true,
        },
        year: {
            type: String,
            required: true,
        },
        interestedInPlacement: {
            type: Boolean,
            default: false,
        },
        role: {
            type: String,
            default: 'student',
        },
        cgpa: {
            type: Number,
            default: 0,
        },
        backlogs: {
            type: Number,
            default: 0,
        },
        attendance: {
            type: Number,
            default: 0,
        },
        percentage: {
            type: Number,
            default: 0,
        },
        semester: {
            type: String,
            default: '1',
        },
        skills: [{
            type: String,
        }],
        resume: {
            type: String,
        },
    },
    {
        timestamps: true,
        collection: 'students'
    }
);

module.exports = mongoose.model('Student', studentSchema);
