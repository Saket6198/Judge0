import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 20,
    },
    emailId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        immutable: true,
    },
    age: {
        type: Number,
        min: 6,
        max: 80,
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
        required: true,
    },
    problemSolved: {
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'problem',
            unique: true, // Ensure each problem is unique in the array
        }]
    },
    password: {
        type: String,
        minlength: 8,
        maxlength: 100, // Increased to accommodate hashed passwords
        required: true,        
    }
}, {
    timestamps: true,
});

const userModel = mongoose.model('user', userSchema);

export default userModel;