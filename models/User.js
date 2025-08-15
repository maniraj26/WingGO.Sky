const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    phone_number: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        unique: true,
        sparse: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    name: {
        type: String,
        trim: true,
        required: true
    },
    address: {
        street: String,
        city: String,
        state: String,
        pincode: String
    },
    is_verified: {
        type: Boolean,
        default: false
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    last_login: {
        type: Date
    }
});

module.exports = mongoose.model('User', userSchema);
