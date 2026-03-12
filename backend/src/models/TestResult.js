
const mongoose = require('mongoose');

const testResultSchema = mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        studentName: {
            type: String,
            required: true
        },
        regNo: {
            type: String,
            required: true
        },
        test: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Test',
            required: true,
        },
        score: {
            type: Number,
            required: true,
        },
        totalMarks: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ['pass', 'fail'],
            required: true,
        },
        malpracticeFlags: {
            type: Number,
            default: 0,
        },
        tabSwitches: {
            type: Number,
            default: 0,
        },
        logs: [
            {
                timestamp: Date,
                event: String, // 'tab_switch', 'fullscreen_exit'
            }
        ]
    },
    {
        timestamps: true,
    }
);

// Ensure one result per student per test (unless re-takes allowed logic handled elsewhere)
testResultSchema.index({ student: 1, test: 1 }, { unique: true });

const TestResult = mongoose.model('TestResult', testResultSchema);

module.exports = TestResult;
