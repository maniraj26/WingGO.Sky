const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const dotenv = require('dotenv');
const Razorpay = require('razorpay');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');


// Store OTPs temporarily (in production, use Redis or similar)
const otpStore = new Map();

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/drone_delivery', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch((err) => console.error('MongoDB connection error:', err));

// User Schema is defined in models/User.js
const User = require('./models/User');

// Generate OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP endpoint
app.post('/api/send-otp', async (req, res) => {
    const { phoneNumber } = req.body;

    if (!phoneNumber || !/^\+?[1-9]\d{9,14}$/.test(phoneNumber)) {
        return res.status(400).json({ error: 'Invalid phone number' });
    }

    try {
        // Generate OTP
        const otp = generateOTP();
        // Store OTP with expiration (5 minutes)
        otpStore.set(phoneNumber, {
            otp,
            expiry: Date.now() + 5 * 60 * 1000
        });

        // In production, integrate with SMS service here
        // For development, just return success
        console.log(`OTP for ${phoneNumber}: ${otp}`); // For testing only

        res.json({ message: 'OTP sent successfully' });
    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({ error: 'Failed to send OTP' });
    }
});

// Verify OTP and login/register user
app.post('/api/verify-otp', async (req, res) => {
    const { phoneNumber, otp } = req.body;

    try {
        // Check if OTP exists and is valid
        const storedOTPData = otpStore.get(phoneNumber);
        if (!storedOTPData || storedOTPData.otp !== otp || Date.now() > storedOTPData.expiry) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }

        // Clear used OTP
        otpStore.delete(phoneNumber);

        // Check if user exists
        let user = await User.findOne({ phoneNumber });
        
        let userId;
        if (!user) {
            // Create new user
            user = await User.create({
                phoneNumber,
                isVerified: true,
                lastLogin: new Date()
            });
            userId = user._id;
        } else {
            // Update existing user's last login
            userId = user._id;
            user.lastLogin = new Date();
            await user.save();
        }

        // Generate JWT token
        const token = jwt.sign({ userId, phoneNumber }, JWT_SECRET, { expiresIn: '24h' });

        res.json({
            message: 'Authentication successful',
            token,
            isNewUser: user.length === 0
        });
    } catch (error) {
        console.error('Error in verification:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update user profile
app.put('/api/user/profile', async (req, res) => {
    const { name, address } = req.body;
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);

        await User.findByIdAndUpdate(decoded.userId, {
            name,
            address
        });

        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user profile
app.get('/api/user/profile', async (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);

        const user = await User.findById(decoded.userId)
            .select('phoneNumber name address createdAt lastLogin');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
