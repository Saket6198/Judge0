import { time, timeStamp } from "console";
import mongoose, { Schema } from "mongoose";
import { ref } from "process";

const problemSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    tags: {
        type: [String],
        enum: ['array', 'math', 'string', 'linked-list', 'tree', 'graph', 'dynamic-programming', 'greedy', 'backtracking', 'sorting', 'searching'],
        required: true,
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        required: true,
    },
    visibleTestCases: [
        {
            input: {
                type: String,
                required: true,
            },
            output: {
                type: String,
                required: true,
            },
            explanation: {
                type: String,
                required: true,
            }
        }
    ],
    HiddenTestCases: [
        {
            input: {
                type: String,
                required: true,
            },
            output: {
                type: String,
                required: true,
            }
        }
    ],
    startCode: [
        {
            language: {
                type: String,
                enum: ['c', 'c++', 'java', 'python', 'javascript'],
                required: true,
            },
            initialCode: {
                type: String,
                required: true,
            }
        }
    ],
    referenceSolutions: [
        {
            language: {
                type: String,
            },
            solution: { 
                type: String,
                required: true,
            }
        }
    ],
    problemCreator: {
        type: Schema.Types.ObjectId,
        ref: 'user',
        required: true,
    }
}, {
    timestamps: true,
});

const problemModel = mongoose.model('problem', problemSchema);

export default problemModel;
