import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "react-toastify";
import { axiosClient } from "../utils/axiosClient";

interface Problem {
  _id: string;
  title: string;
  tags: string[];
  difficulty: string;
}

interface VideoData {
  problemId: string;
  secureUrl?: string;
  duration?: number;
  thumbnailUrl?: string;
}

export const UploadVideo = () => {
  const navigate = useNavigate();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [videos, setVideos] = useState<{ [key: string]: VideoData }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const response = await axiosClient.get("/problem/getAllProblem");
        setProblems(response.data);

        // Fetch video data for each problem
        const videoData: { [key: string]: VideoData } = {};
        for (const problem of response.data) {
          try {
            console.log(
              `Fetching video data for problem: ${problem._id} - ${problem.title}`
            );
            const videoResponse = await axiosClient.get(
              `/problem/problemById/${problem._id}`
            );
            console.log(
              `Video response for ${problem._id}:`,
              videoResponse.data
            );

            if (videoResponse.data.secureUrl) {
              videoData[problem._id] = {
                problemId: problem._id,
                secureUrl: videoResponse.data.secureUrl,
                duration: videoResponse.data.duration,
                thumbnailUrl: videoResponse.data.thumbnailUrl,
              };
              console.log(
                `Video found for ${problem.title}:`,
                videoData[problem._id]
              );
            } else {
              console.log(`No video data in response for ${problem.title}`);
            }
          } catch (err: any) {
            // Video doesn't exist for this problem, continue
            console.log(
              `No video found for problem ${problem._id} - ${problem.title}:`,
              err.message
            );
          }
        }
        setVideos(videoData);
        console.log("Fetched video data:", videoData);
      } catch (err: any) {
        console.error("Error fetching problems:", err);
        toast.error("❌ Failed to load problems");
      } finally {
        setLoading(false);
      }
    };

    fetchProblems();

    // Add event listener to refresh data when page comes back into focus
    const handleFocus = () => {
      refreshData();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  // Add a function to refresh data
  const refreshData = async () => {
    try {
      const response = await axiosClient.get("/problem/getAllProblem");
      setProblems(response.data);

      const videoData: { [key: string]: VideoData } = {};
      for (const problem of response.data) {
        try {
          const videoResponse = await axiosClient.get(
            `/problem/problemById/${problem._id}`
          );
          if (videoResponse.data.secureUrl) {
            videoData[problem._id] = {
              problemId: problem._id,
              secureUrl: videoResponse.data.secureUrl,
              duration: videoResponse.data.duration,
              thumbnailUrl: videoResponse.data.thumbnailUrl,
            };
          }
        } catch (err: any) {
          console.log(`No video found for problem ${problem._id}`);
        }
      }
      setVideos(videoData);
      console.log("Refreshed video data:", videoData);
    } catch (err: any) {
      console.error("Error refreshing data:", err);
      toast.error("❌ Failed to refresh data");
    }
  };

  const handleDeleteVideo = async (problemId: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this video? This action cannot be undone."
    );

    if (!confirmDelete) return;

    try {
      await axiosClient.delete(`/video/delete/${problemId}`);

      // Remove video from state
      const updatedVideos = { ...videos };
      delete updatedVideos[problemId];
      setVideos(updatedVideos);

      toast.success("✅ Video deleted successfully");
    } catch (err: any) {
      console.error("Error deleting video:", err);
      if (err.response?.status === 404) {
        toast.error("❌ Video not found");
      } else {
        toast.error("❌ Failed to delete video");
      }
    }
  };

  const handleUploadVideo = (problemId: string) => {
    navigate(`/upload-video/${problemId}`);
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
          <button
            className="btn btn-ghost mr-2"
            onClick={refreshData}
            disabled={loading}
          >
            {loading ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              "Refresh"
            )}
          </button>
          <Link to="/" className="btn btn-ghost">
            Back to Home
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Problems Table */}
        <div className="overflow-x-auto bg-base-200 rounded-lg shadow-md">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Title</th>
                <th>Difficulty</th>
                <th>Tags</th>
                <th>Video Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {problems.map((problem) => {
                const hasVideo = videos[problem._id];
                return (
                  <tr key={problem._id} className="hover:bg-base-300">
                    <td className="font-medium">{problem.title}</td>
                    <td>
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
                    </td>
                    <td>
                      {problem.tags.map((tag, index) => (
                        <div
                          key={index}
                          className="badge badge-neutral mr-1 mb-1"
                        >
                          {tag}
                        </div>
                      ))}
                    </td>
                    <td>
                      {hasVideo ? (
                        <div className="badge badge-success">
                          Video Available
                        </div>
                      ) : (
                        <div className="badge badge-outline">No Video</div>
                      )}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleUploadVideo(problem._id)}
                        >
                          {hasVideo ? "Replace Video" : "Upload Video"}
                        </button>
                        {hasVideo && (
                          <button
                            className="btn btn-error btn-sm"
                            onClick={() => handleDeleteVideo(problem._id)}
                          >
                            Delete Video
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {problems.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8">
                    No problems found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
