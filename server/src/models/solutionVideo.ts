import mongoose from "mongoose";

const videoSchema = new mongoose.Schema(
  {
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "problems",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    cloudinaryPublicId: {
      type: String,
      required: true,
    },
    // cloudinaryUrl: {
    //     type: String,
    //     required: true
    // },
    secureUrl: {
      type: String,
      required: true,
    },
    thumbnailUrl: {
      type: String,
    },
    duration: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

export const SolutionVideo = mongoose.model("solutionVideo", videoSchema);
