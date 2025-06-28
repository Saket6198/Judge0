import { useEffect, useState } from "react";
import { useAppDispatch } from "../store/hooks";
import { axiosClient } from "../utils/axiosClient";
import { logoutUser } from "../authSlice";
import { useNavigate, Link } from "react-router";
import { toast } from "react-toastify";

interface ProblemSolved {
  _id: string;
  title?: string;
  tags?: string[]; // Changed from string to string[]
  difficulty?: string;
}

interface UserProfile {
  _id: string;
  name: string;
  emailId: string;
  role: string;
  problemSolved: ProblemSolved[];
  createdAt: string;
  updatedAt: string;
}

export const Profile = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [solvedProblemsDetails, setSolvedProblemsDetails] = useState<any[]>([]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get("/user/profile");
        setUserProfile(response.data.data);

        // If the user has solved problems, fetch detailed information
        if (
          response.data.data.problemSolved &&
          response.data.data.problemSolved.length > 0
        ) {
          fetchSolvedProblemsDetails(response.data.data.problemSolved);
        }
      } catch (err: any) {
        console.error(
          "Error fetching user profile:",
          err.response?.data?.error || err.message
        );
        toast.error("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const fetchSolvedProblemsDetails = async (problemIds: ProblemSolved[]) => {
    try {
      // Assuming you have a way to get problem details - this is a placeholder
      // You might need to adapt this based on your actual API
      const response = await axiosClient.get("/problem/getAllProblem");
      const allProblems = response.data;

      // Match solved problem IDs with full problem details
      const solvedDetails = problemIds.map((problemId) => {
        return (
          allProblems.find(
            (p: any) =>
              p._id ===
              (typeof problemId === "string" ? problemId : problemId._id)
          ) || { _id: problemId }
        );
      });

      setSolvedProblemsDetails(solvedDetails);
    } catch (err: any) {
      console.error(
        "Error fetching problem details:",
        err.response?.data?.error || err.message
      );
    }
  };
  const handleDeleteAccount = async () => {
    try {
      await axiosClient.delete("/user/deleteProfile");

      // Show success toast
      toast.success("Account deleted successfully");

      // Wait a moment for toast to be visible before redirecting
      setTimeout(() => {
        dispatch(logoutUser());
        navigate("/login");
      }, 1500);
    } catch (err: any) {
      // Handle errors and show error toast
      console.error(
        "Error deleting account:",
        err.response?.data?.error || err.message
      );
      toast.error(err.response?.data?.error || "Failed to delete account");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center p-4">
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-error">Profile Not Found</h2>
            <p>Unable to load your profile information.</p>
            <div className="card-actions justify-end">
              <button onClick={() => navigate("/")} className="btn btn-primary">
                Go to Homepage
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100">
      {/* Navigation Bar */}
      <div className="navbar bg-base-200 shadow-md mb-8">
        <div className="navbar-start">
          <Link to="/" className="btn btn-ghost text-xl font-bold">
            Judge0
          </Link>
        </div>
        <div className="navbar-end">
          <Link to="/" className="btn btn-ghost">
            Back to Problems
          </Link>
        </div>
      </div>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Info */}
          <div className="lg:col-span-1">
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body">
                <div className="flex flex-col items-center mb-6">
                  <div className="avatar mb-4">
                    <div className="w-24 h-24 rounded-full bg-primary text-primary-content flex items-center justify-center">
                      <span className="text-3xl font-bold">
                        {userProfile.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold">{userProfile.name}</h2>
                  <p className="text-base-content/70">{userProfile.emailId}</p>
                  <div className="badge badge-accent mt-2">
                    {userProfile.role}
                  </div>
                </div>
                <div className="divider"></div>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-base-content/70">Member Since</span>
                    <span>
                      {new Date(userProfile.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-base-content/70">
                      Problems Solved
                    </span>
                    <span className="badge badge-primary">
                      {userProfile.problemSolved?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-base-content/70">Last Updated</span>
                    <span>
                      {new Date(userProfile.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>{" "}
                <div className="card-actions justify-center mt-6">
                  <button
                    className="btn btn-error btn-outline w-full"
                    onClick={() => {
                      if (
                        window.confirm(
                          "Are you sure you want to delete your account? This action cannot be undone. All your data including solved problems will be permanently removed."
                        )
                      ) {
                        handleDeleteAccount();
                      }
                    }}
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Solved Problems */}
          <div className="lg:col-span-2">
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body">
                <h2 className="card-title text-xl font-bold mb-4">
                  Solved Problems
                </h2>

                {solvedProblemsDetails.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="table w-full">
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Difficulty</th>
                          <th>Tags</th>
                        </tr>
                      </thead>
                      <tbody>
                        {solvedProblemsDetails.map((problem) => (
                          <tr
                            key={problem._id}
                            className="hover:bg-base-300 cursor-pointer"
                            onClick={() => navigate(`/problem/${problem._id}`)}
                          >
                            <td className="font-medium">
                              {problem.title || "Unknown Problem"}
                            </td>
                            <td>
                              {problem.difficulty && (
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
                              )}
                            </td>
                            <td>
                              {problem.tags && Array.isArray(problem.tags) ? (
                                problem.tags.map(
                                  (tag: string, index: number) => (
                                    <div
                                      key={index}
                                      className="badge badge-neutral mr-1 mb-1"
                                    >
                                      {tag}
                                    </div>
                                  )
                                )
                              ) : problem.tags ? (
                                <div className="badge badge-neutral">
                                  {problem.tags}
                                </div>
                              ) : null}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">🧩</div>
                    <h3 className="text-lg font-semibold">
                      No problems solved yet
                    </h3>
                    <p className="text-base-content/70">
                      Start solving problems to see them here!
                    </p>
                    <Link to="/" className="btn btn-primary mt-4">
                      Solve Problems
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Stats Card */}
            <div className="card bg-base-200 shadow-xl mt-6">
              <div className="card-body">
                <h2 className="card-title text-xl font-bold mb-4">Stats</h2>
                <div className="stats stats-vertical lg:stats-horizontal shadow">
                  <div className="stat">
                    <div className="stat-title">Easy</div>
                    <div className="stat-value text-success">
                      {
                        solvedProblemsDetails.filter(
                          (p) => p.difficulty === "easy"
                        ).length
                      }
                    </div>
                    <div className="stat-desc">Problems solved</div>
                  </div>

                  <div className="stat">
                    <div className="stat-title">Medium</div>
                    <div className="stat-value text-warning">
                      {
                        solvedProblemsDetails.filter(
                          (p) => p.difficulty === "medium"
                        ).length
                      }
                    </div>
                    <div className="stat-desc">Problems solved</div>
                  </div>

                  <div className="stat">
                    <div className="stat-title">Hard</div>
                    <div className="stat-value text-error">
                      {
                        solvedProblemsDetails.filter(
                          (p) => p.difficulty === "hard"
                        ).length
                      }
                    </div>
                    <div className="stat-desc">Problems solved</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>{" "}
      {/* We removed the custom modal and are using a simple browser confirm instead */}
    </div>
  );
};
