
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./src/config/db');
const { initializeReminderSystem } = require('./src/services/reminderService');

const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Connect to Database
connectDB();

const app = express();

// Middleware
const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:5173', // Vite default local
    'http://localhost:3000'
];

app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            var msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(morgan('dev'));

// Routes (to be imported)
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/student', require('./src/routes/studentRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes'));
app.use('/api/placement', require('./src/routes/placementRoutes'));
app.use('/api/test', require('./src/routes/testRoutes')); // Add test routes

// Root Route
app.get('/', (req, res) => {
    res.json({ message: 'Studee Mentor Pro API is running...' });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    
    // Initialize reminder system after server starts
    initializeReminderSystem();
});
