const mongoose = require('mongoose');

const HistorySchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    url: { 
        type: String, 
        required: true 
    },
    status: { 
        type: String, 
        enum: ['up', 'down'], 
        required: true 
    },
    responseTime: { 
        type: Number, 
        default: null 
    },
    timestamp: { 
        type: Date, 
        default: Date.now 
    },
    duration: { 
        type: Number, 
        default: 0 
    }
});

// Indexes for faster queries
HistorySchema.index({ userId: 1, url: 1, timestamp: -1 });
HistorySchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('History', HistorySchema);