
const mongoose = require('mongoose');

const studyMaterialSchema = mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
        },
        type: {
            type: String,
            enum: ['pdf', 'video', 'link'],
            default: 'link',
        },
        link: {
            type: String, // Deprecated in favor of files
        },
        files: [
            {
                name: { type: String, required: true },
                path: { type: String, required: true }
            }
        ],
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
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        duration: {
            type: String, // e.g., "45 mins", "1 hour"
        },
        pages: {
            type: Number, // Number of pages for PDF
        },
    },
    {
        timestamps: true,
    }
);

const StudyMaterial = mongoose.model('StudyMaterial', studyMaterialSchema);

module.exports = StudyMaterial;
