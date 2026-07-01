const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { 
        type: String, 
        required: true, 
        unique: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String, 
        default: '' 
    },
    emailRecipients: { 
        type: [String], 
        default: [] 
    },
    websites: [{ 
        url: String, 
        status: { 
            type: String, 
            default: 'pending' 
        }, 
        lastChecked: Date 
    }],
    settings: {
        checkInterval: { 
            type: Number, 
            default: 60 
        },
        alertOnDown: { 
            type: Boolean, 
            default: true 
        },
        alertOnRecovery: { 
            type: Boolean, 
            default: true 
        }
    }
}, { 
    timestamps: true 
});

module.exports = mongoose.model('User', UserSchema);