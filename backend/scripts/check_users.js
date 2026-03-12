
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Faculty = require('../src/models/Faculty');
const Student = require('../src/models/Student');
const PlacementOfficer = require('../src/models/PlacementOfficer');

const checkUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const faculties = await Faculty.find({});
        console.log('Faculties:');
        faculties.forEach(f => console.log(`- ${f.email}: role=${f.role}`));

        const students = await Student.find({});
        console.log('Students:');
        students.forEach(s => console.log(`- ${s.email}: role=${s.role}`));

        const officers = await PlacementOfficer.find({});
        console.log('Officers:');
        officers.forEach(o => console.log(`- ${o.email}: role=${o.role}`));

        process.exit(0);
    } catch (error) {
        console.error('Error checking users:', error);
        process.exit(1);
    }
};

checkUsers();
