import mongoose, { Schema } from "mongoose";

const submissionSchema = new mongoose.Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    problemId: {
        type: Schema.Types.ObjectId,
        ref: "Problem",
        required: true
    },
    code: {
        type: String,
        required: true
    },
    language: {
        type: String,
        required: true,
        enum: ["javascript", "python", "java", "c++", "c"]
    },
    status: {
        type: String,
        enum: ["pending", "accepted", "wrong", "error"],
        default: "pending"
    },
    runtime: {
        type: Number,   // milliseconds
        default: 0
    },
    memory: {
        type: Number,   // kbytes
        default: 0
    },
    errorMessage: {
        type: String,
        default: ""
    },
    testCasesPassed: {
        type: Number,
        default: 0
    },
    testCasesTotal: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

submissionSchema.index({ userId: 1, problemId: 1 });


const submissionModel = mongoose.model('submission', submissionSchema);
export default submissionModel;