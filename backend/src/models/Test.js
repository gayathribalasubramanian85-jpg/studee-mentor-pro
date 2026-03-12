
const mongoose = require('mongoose');

const questionSchema = mongoose.Schema({
    questionText: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: Number, required: true }, // Index of option
    marks: { type: Number, default: 1 },
});

const testSchema = mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        week: {
            type: Number,
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
        questions: [questionSchema],
        duration: {
            type: Number, // in minutes
            required: true,
        },
        passMarks: {
            type: Number,
            required: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true,
    }
);

const Test = mongoose.model('Test', testSchema);

module.exports = Test;
