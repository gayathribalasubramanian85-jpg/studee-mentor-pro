const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.join(__dirname, '.env') });

const Student = require('./src/models/Student');

const resetPassword = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const regNo = 'CSE2024001';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(regNo, salt);

        const result = await Student.updateOne(
            { email: 'john.doe@college.edu' },
            { $set: { password: hashedPassword } }
        );

        if (result.modifiedCount > 0) {
            console.log('--- PASSWORD RESET SUCCESS ---');
            console.log('User: john.doe@college.edu');
            console.log('New Password (is Register Number):', regNo);
            console.log('------------------------------');
        } else {
            console.log('User not found or password already matches.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

resetPassword();
