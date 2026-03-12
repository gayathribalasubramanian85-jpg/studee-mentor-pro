
const mongoose = require('mongoose');

const placementOfficerSchema = mongoose.Schema(
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
        role: {
            type: String,
            default: 'placementofficer',
        },
    },
    {
        timestamps: true,
        collection: 'placementofficer'
    }
);

module.exports = mongoose.model('PlacementOfficer', placementOfficerSchema);
