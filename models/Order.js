const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
        name: {
            type: String,
            required: true
        },
        category: {
            type: String,
            enum: ['food', 'medical', 'grocery'],
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        price: {
            type: Number,
            required: true
        }
    }],
    pickup: {
        address: {
            type: String,
            required: true
        },
        coordinates: {
            lat: Number,
            lng: Number
        }
    },
    dropoff: {
        address: {
            type: String,
            required: true
        },
        coordinates: {
            lat: Number,
            lng: Number
        }
    },
    payment: {
        method: {
            type: String,
            enum: ['razorpay', 'googlepay'],
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'completed', 'failed'],
            default: 'pending'
        },
        transactionId: String
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'picked', 'in-transit', 'delivered', 'cancelled'],
        default: 'pending'
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Order', orderSchema);
