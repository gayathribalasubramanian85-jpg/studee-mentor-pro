const mongoose = require('mongoose');

const weekSchema = mongoose.Schema(
    {
        weekNumber: {
            type: Number,
            required: true,
        },
        startDate: {
            type: Date,
            required: true,
        },
        endDate: {
            type: Date,
            required: true,
        },
        department: {
            type: String,
            required: true,
        },
        year: {
            type: String,
            required: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Faculty',
            required: true,
        },
    },
    {
        timestamps: true,
        collection: 'weeks'
    }
);

// Compound index to ensure unique week numbers per department/year
weekSchema.index({ weekNumber: 1, department: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Week', weekSchema);
