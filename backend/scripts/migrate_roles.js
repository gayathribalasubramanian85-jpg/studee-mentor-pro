
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const migrateRoles = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;

        // Update faculties collection: 'admin' -> 'faculty' (and set default if missing)
        console.log('Migrating faculties...');
        const facultyResult = await db.collection('faculties').updateMany(
            { $or: [{ role: 'admin' }, { role: { $exists: false } }] },
            { $set: { role: 'faculty' } }
        );
        console.log(`Updated ${facultyResult.modifiedCount} faculty records.`);

        // Update placementofficer collection: 'placement' -> 'placementofficer'
        console.log('Migrating placementofficer...');
        const placementResult = await db.collection('placementofficer').updateMany(
            { $or: [{ role: 'placement' }, { role: { $exists: false } }] },
            { $set: { role: 'placementofficer' } }
        );
        console.log(`Updated ${placementResult.modifiedCount} placement officer records.`);

        // Ensure students have role: 'student'
        console.log('Migrating students...');
        const studentResult = await db.collection('students').updateMany(
            { role: { $ne: 'student' } },
            { $set: { role: 'student' } }
        );
        console.log(`Updated ${studentResult.modifiedCount} student records.`);

        console.log('Migration complete');
        process.exit(0);
    } catch (error) {
        console.error('Error during migration:', error);
        process.exit(1);
    }
};

migrateRoles();
