import { v2 as cloudinary } from "cloudinary";
import { Request, Response } from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import problemModel from "../models/problems_model";
import { SolutionVideo } from "../models/solutionVideo";
import { start } from "repl";
import { format } from "path";
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
});

export const generateUploadSignature = async (req: Request, res: Response) => {
  try {
    const { problemId } = req.query;
    const userId = req.result?._id;

    console.log("Generate upload signature request:", { problemId, userId });

    // Check if Cloudinary is properly configured
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      console.error("Cloudinary configuration missing:", {
        cloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: !!process.env.CLOUDINARY_API_KEY,
        apiSecret: !!process.env.CLOUDINARY_API_SECRET,
      });
      res
        .status(500)
        .json({
          error: "Server configuration error. Please contact administrator.",
        });
      return;
    }

    if (!problemId) {
      res.status(400).json({ error: "Problem ID is required" });
      return;
    }

    if (!userId) {
      res.status(401).json({ error: "User authentication required" });
      return;
    }

    const problem = await problemModel.findById(problemId);
    if (!problem) {
      res.status(404).json({ error: "Problem not found" });
      return;
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    const publicId = `judge0-solutions/${problemId}/${userId}_${timestamp}`;

    // Parameters to be signed (alphabetical order is important for Cloudinary)
    const uploadParams = {
      public_id: publicId,
      timestamp: timestamp,
    };

    // Generate signature using only the parameters that will be sent
    const signature = cloudinary.utils.api_sign_request(
      uploadParams,
      process.env.CLOUDINARY_API_SECRET || ""
    );

    console.log("Upload parameters for signature:", uploadParams);
    console.log("Generated signature:", signature);

    const responseData = {
      signature: signature,
      timestamp: timestamp,
      apiKey: process.env.CLOUDINARY_API_KEY || "",
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
      publicId: publicId,
      uploadUrl: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/video/upload`,
    };

    console.log("Upload signature response:", {
      ...responseData,
      apiKey: responseData.apiKey ? "[HIDDEN]" : "MISSING",
      cloudName: responseData.cloudName || "MISSING",
    });

    res.status(200).json(responseData);
  } catch (err: any) {
    console.error("Error generating upload signature:", err);
    res.status(500).json({
      error: err.message || "Internal Server Error",
    });
  }
};

export const saveVideoMetadata = async (req: Request, res: Response) => {
  try {
    const { problemId, cloudinaryPublicId, secureUrl, duration } = req.body;

    console.log("Save video metadata request:", {
      problemId,
      cloudinaryPublicId,
      secureUrl,
      duration,
    });

    const userId = req.result?._id;

    if (!userId) {
      res.status(401).json({ error: "User authentication required" });
      return;
    }

    if (!problemId || !cloudinaryPublicId || !secureUrl) {
      res
        .status(400)
        .json({
          error:
            "Missing required fields: problemId, cloudinaryPublicId, secureUrl",
        });
      return;
    }

    // Verify the video exists on Cloudinary
    let cloudinaryResource;
    try {
      cloudinaryResource = await cloudinary.api.resource(cloudinaryPublicId, {
        resource_type: "video",
      });
    } catch (cloudinaryError: any) {
      console.error("Cloudinary resource not found:", cloudinaryError);
      res.status(400).json({ error: "Video not found on Cloudinary" });
      return;
    }

    // Check if the video already exists for this problem
    const existingVideo = await SolutionVideo.findOne({
      problemId: problemId,
    });

    const thumbnailUrl = cloudinary.url(cloudinaryResource.public_id, {
      resource_type: "video",
      transformation: [
        { width: 400, height: 225, crop: "fill" },
        { quality: "auto" },
        { start_offset: "2s" },
      ],
      format: "jpg",
    });

    let videoSolution;

    if (existingVideo) {
      // Update existing video
      console.log("Updating existing video for problem:", problemId);
      videoSolution = await SolutionVideo.findOneAndUpdate(
        { problemId: problemId },
        {
          userId,
          cloudinaryPublicId,
          secureUrl,
          duration: cloudinaryResource.duration || duration || 0,
          thumbnailUrl,
        },
        { new: true }
      );
    } else {
      // Create new video record
      console.log("Creating new video record for problem:", problemId);
      videoSolution = new SolutionVideo({
        problemId,
        userId,
        cloudinaryPublicId,
        secureUrl,
        duration: cloudinaryResource.duration || duration || 0,
        thumbnailUrl,
      });
      await videoSolution.save();
    }

    res.status(201).json({
      message: "Video metadata saved successfully",
      video: {
        id: videoSolution?._id,
        duration: videoSolution?.duration,
        thumbnailUrl: videoSolution?.thumbnailUrl,
        uploadedAt: videoSolution?.createdAt,
      },
    });
  } catch (err: any) {
    console.error("Error saving video metadata:", err);
    res.status(500).json({
      error: err.message || "Internal Server Error",
    });
  }
};

export const deleteVideo = async (req: Request, res: Response) => {
  try {
    const { problemId } = req.params;
    const userId = req.result?._id; // Fixed typo: was userId = req.result?.idl;
    const video = await SolutionVideo.findOneAndDelete({
      problemId: problemId,
    });
    if (!video) {
      res.status(404).json({ error: "Video not found" });
      return;
    }
    await cloudinary.uploader.destroy(video.cloudinaryPublicId, {
      resource_type: "video",
      invalidate: true,
    });
    res.status(200).json({
      message: "Video deleted successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      error: err.message || "Internal Server Error",
    });
  }
};

export const getVideoByProblemId = async (req: Request, res: Response) => {
  try {
    const { problemId } = req.params;
    console.log("Getting video for problemId:", problemId);

    // Try multiple ways to find the video
    const videoWithObjectId = await SolutionVideo.findOne({
      problemId: new mongoose.Types.ObjectId(problemId),
    });
    const videoWithString = await SolutionVideo.findOne({
      problemId: problemId,
    });
    const allVideos = await SolutionVideo.find({});

    console.log("Video found with ObjectId:", videoWithObjectId ? "Yes" : "No");
    console.log("Video found with string:", videoWithString ? "Yes" : "No");
    console.log("Total videos in database:", allVideos.length);
    console.log(
      "All videos:",
      allVideos.map((v) => ({ _id: v._id, problemId: v.problemId }))
    );

    const video = videoWithObjectId || videoWithString;

    if (video) {
      res.status(200).json({
        message: "Video found",
        video: video,
      });
    } else {
      res.status(404).json({
        message: "Video not found",
        searchedFor: problemId,
        allVideos: allVideos.map((v) => ({
          _id: v._id,
          problemId: v.problemId,
        })),
      });
    }
  } catch (err: any) {
    console.error("Error getting video by problem ID:", err);
    res.status(500).json({
      error: err.message || "Internal Server Error",
    });
  }
};
