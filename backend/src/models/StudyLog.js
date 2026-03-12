
const mongoose = require('mongoose');

const studyLogSchema = mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        date: {
            type: String, // YYYY-MM-DD
            required: true,
        },
        activeMinutes: {
            type: Number,
            default: 0,
        },
        sessions: [
            {
                startTime: Date,
                endTime: Date,
                duration: Number,
            }
        ],
    },
    {
        timestamps: true,
    }
);

// Compound index to ensure one log per student per day
studyLogSchema.index({ student: 1, date: 1 }, { unique: true });

const StudyLog = mongoose.model('StudyLog', studyLogSchema);

module.exports = StudyLog;
