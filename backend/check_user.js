const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.join(__dirname, '.env') });

const Student = require('./src/models/Student');

const findValidStudent = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const students = await Student.find().limit(20);
        console.log(`Checking ${students.length} students...`);

        for (const s of students) {
            const isMatch = await bcrypt.compare(s.regNo, s.password);
            if (isMatch) {
                console.log(`[VALID] ${s.name} | Email: ${s.email} | RegNo: ${s.regNo}`);
            } else {
                // console.log(`[INVALID] ${s.name}`);
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

findValidStudent();
