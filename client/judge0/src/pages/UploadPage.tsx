import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router";
import { toast } from "react-toastify";
import { axiosClient } from "../utils/axiosClient";
import axios from "axios";

interface Problem {
  _id: string;
  title: string;
  difficulty: string;
}

export const UploadPage = () => {
  const { problemId } = useParams<{ problemId: string }>();
  const navigate = useNavigate();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        if (!problemId) {
          toast.error("❌ Problem ID is required");
          navigate("/upload-video");
          return;
        }

        const response = await axiosClient.get(
          `/problem/problemById/${problemId}`
        );
        setProblem(response.data);
      } catch (err: any) {
        console.error("Error fetching problem:", err);
        if (err.response?.status === 404) {
          toast.error("❌ Problem not found");
        } else {
          toast.error("❌ Failed to load problem");
        }
        navigate("/upload-video");
      } finally {
        setLoading(false);
      }
    };

    fetchProblem();
  }, [problemId, navigate]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("video/")) {
        toast.error("❌ Please select a valid video file");
        return;
      }

      // Validate file size (max 100MB)
      const maxSize = 100 * 1024 * 1024; // 100MB in bytes
      if (file.size > maxSize) {
        toast.error("❌ File size should be less than 100MB");
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !problemId) {
      toast.error("❌ Please select a video file");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      console.log("Starting upload process for problemId:", problemId);

      // Get upload signature from backend
      const signatureResponse = await axiosClient.get(`/video/create`, {
        params: { problemId },
      });

      console.log("Got signature response:", signatureResponse.data);

      const { signature, timestamp, apiKey, publicId, uploadUrl } =
        signatureResponse.data;

      // Validate required fields
      if (!signature || !timestamp || !apiKey || !publicId || !uploadUrl) {
        throw new Error("Missing required upload parameters from server");
      }

      console.log("Creating FormData for upload...");

      // Create form data for Cloudinary upload
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("signature", signature);
      formData.append("timestamp", timestamp.toString());
      formData.append("api_key", apiKey);
      formData.append("public_id", publicId);

      console.log("FormData contents:", {
        signature: signature,
        timestamp: timestamp,
        api_key: apiKey,
        public_id: publicId,
        file_size: selectedFile.size,
        file_type: selectedFile.type,
      });

      console.log("Uploading to Cloudinary...", uploadUrl);

      // Upload to Cloudinary using regular axios with progress tracking
      const uploadResponse = await axios.post(uploadUrl, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(progress);
            console.log("Upload progress:", progress + "%");
          }
        },
      });

      console.log("Cloudinary upload successful:", uploadResponse.data);

      const uploadResult = uploadResponse.data;
      setUploadProgress(100);

      // Save video metadata to backend
      console.log("Saving video metadata to backend...");
      await axiosClient.post("/video/save", {
        problemId,
        cloudinaryPublicId: uploadResult.public_id,
        secureUrl: uploadResult.secure_url,
        duration: uploadResult.duration || 0,
      });

      toast.success("✅ Video uploaded successfully!");
      // Force a page refresh to ensure data is updated
      window.location.href = "/upload-video";
    } catch (err: any) {
      console.error("Error uploading video:", err);

      // Log the detailed error response from Cloudinary
      if (err.response?.data) {
        console.error("Cloudinary error response:", err.response.data);
      }

      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          toast.error(
            "❌ Authentication failed with Cloudinary. Please try again."
          );
        } else if (err.response?.data?.error) {
          toast.error(`❌ ${err.response.data.error}`);
        } else if (err.response?.status === 404) {
          toast.error("❌ Problem not found");
        } else if (err.response && err.response.status >= 500) {
          toast.error("❌ Server error. Please try again later.");
        } else {
          toast.error(`❌ Upload failed: ${err.message}`);
        }
      } else {
        toast.error("❌ Failed to upload video. Please try again.");
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100">
      {/* Navigation Bar */}
      <div className="navbar bg-base-200 shadow-md">
        <div className="navbar-start">
          <Link to="/" className="btn btn-ghost text-xl font-bold">
            Judge0
          </Link>
        </div>
        <div className="navbar-center">
          <h1 className="text-2xl font-bold">Upload Video</h1>
        </div>
        <div className="navbar-end">
          <Link to="/upload-video" className="btn btn-ghost">
            Back to Upload Video
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {problem && (
          <div className="bg-base-200 rounded-lg p-6 mb-8 shadow-md">
            <h2 className="text-2xl font-bold mb-2">{problem.title}</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm">Difficulty:</span>
              <div
                className={`badge ${
                  problem.difficulty === "easy"
                    ? "badge-success"
                    : problem.difficulty === "medium"
                    ? "badge-warning"
                    : "badge-error"
                }`}
              >
                {problem.difficulty}
              </div>
            </div>
          </div>
        )}

        <div className="bg-base-200 rounded-lg p-6 shadow-md">
          <h3 className="text-xl font-bold mb-4">Upload Solution Video</h3>

          <div className="form-control w-full mb-6">
            <label className="label">
              <span className="label-text">Select Video File</span>
            </label>
            <input
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="file-input file-input-bordered w-full"
              disabled={isUploading}
            />
            <label className="label">
              <span className="label-text-alt">
                Supported formats: MP4, MOV, AVI, etc. Maximum size: 100MB
              </span>
            </label>
          </div>

          {selectedFile && (
            <div className="alert alert-info mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="stroke-current shrink-0 w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <div>
                <div className="font-bold">File Selected:</div>
                <div className="text-sm">{selectedFile.name}</div>
                <div className="text-sm">
                  Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
            </div>
          )}

          {isUploading && (
            <div className="mb-6">
              <div className="text-sm mb-2">Uploading... {uploadProgress}%</div>
              <progress
                className="progress progress-primary w-full"
                value={uploadProgress}
                max="100"
              ></progress>
            </div>
          )}

          <div className="flex gap-4">
            <button
              className="btn btn-primary flex-1"
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Uploading...
                </>
              ) : (
                "Upload Video"
              )}
            </button>

            <Link
              to="/upload-video"
              className="btn btn-outline"
              onClick={(e) => {
                if (isUploading) {
                  e.preventDefault();
                  toast.warning("Please wait for the upload to complete");
                }
              }}
            >
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
