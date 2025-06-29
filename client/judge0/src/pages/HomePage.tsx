import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { axiosClient } from "../utils/axiosClient";
import { logoutUser } from "../authSlice";
import { Link, useNavigate } from "react-router";

interface Problem {
  _id: string;
  title: string;
  tags: string[]; // Changed from string to string[]
  difficulty: string;
}

export const HomePage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [solvedProblems, setSolvedProblems] = useState<Problem[]>([]);
  const [filters, setFilters] = useState({
    difficulty: "all",
    tag: "all",
    status: "all",
  });
  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const response = await axiosClient.get("/problem/getAllProblem");
        setProblems(response.data);
      } catch (err: any) {
        console.error(
          "Error fetching problems:",
          err.response?.data?.error || err.message
        );
      }
    };

    const fetchSolvedProblems = async () => {
      try {
        const response = await axiosClient.get("/problem/user");
        setSolvedProblems(response.data.problemSolved || []);
      } catch (err: any) {
        // Only log serious errors, not when user simply has no solved problems
        if (err.response?.status !== 404) {
          console.error(
            "Error fetching solved problems:",
            err.response?.data?.error || err.message
          );
        }
        // Always set empty array on error to prevent UI issues
        setSolvedProblems([]);
      }
    };
    fetchProblems();
    if (user) fetchSolvedProblems();
  }, [user]);
  const goProfile = () => {
    navigate("/profile");
  };
  const handleLogout = () => {
    dispatch(logoutUser());
    setSolvedProblems([]);
    // navigate("/login");
  };

  const filteredProblems = problems.filter((problem) => {
    const difficultyMatch =
      filters.difficulty === "all" || filters.difficulty === problem.difficulty;
    const tagMatch =
      filters.tag === "all" || problem.tags.includes(filters.tag);
    const isSolved = solvedProblems.some((sp) => sp._id === problem._id);
    const statusMatch =
      filters.status === "all" ||
      (filters.status === "solved" && isSolved) ||
      (filters.status === "unsolved" && !isSolved);
    return difficultyMatch && tagMatch && statusMatch;
  });

  return (
    <div className="min-h-screen bg-base-100">
      {/* Navigation Bar */}
      <div className="navbar bg-base-200 shadow-md">
        <div className="navbar-start">
          <Link to="/" className="btn btn-ghost text-xl font-bold">
            Judge0
          </Link>
        </div>
        <div className="navbar-end">
          {user ? (
            <div className="dropdown dropdown-end">
              <div
                tabIndex={0}
                role="button"
                className="btn btn-ghost btn-circle avatar"
              >
                <div className="w-10 rounded-full bg-primary text-primary-content flex items-center justify-center">
                  <span className="text-lg font-bold">
                    {user.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
              </div>
              <ul
                tabIndex={0}
                className="menu dropdown-content z-[1] p-2 shadow bg-base-200 rounded-box w-52 mt-4"
              >
                <li>
                  <a onClick={goProfile}>Profile</a>
                </li>
                {user && user.role === "admin" && (
                  <li>
                    <Link to="/admin">Admin Panel</Link>
                  </li>
                )}
                <li>
                  <a onClick={handleLogout}>Logout</a>
                </li>{" "}
              </ul>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary">
              Login
            </Link>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filter Section */}
        <div className="bg-base-200 rounded-lg p-4 mb-8 shadow-md">
          <h2 className="text-xl font-bold mb-4">Filters</h2>
          <div className="flex flex-wrap gap-4">
            {/* Difficulty Filter */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Difficulty</span>
              </label>
              <select
                className="select select-bordered"
                value={filters.difficulty}
                onChange={(e) =>
                  setFilters({ ...filters, difficulty: e.target.value })
                }
              >
                <option value="all">All</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            {/* Tags Filter */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Tags</span>
              </label>
              <select
                className="select select-bordered"
                value={filters.tag}
                onChange={(e) =>
                  setFilters({ ...filters, tag: e.target.value })
                }
              >
                <option value="all">All</option>
                <option value="array">Array</option>
                <option value="string">String</option>
                <option value="tree">Tree</option>
                <option value="graph">Graph</option>
                <option value="dynamic programming">Dynamic Programming</option>
                <option value="greedy">Greedy</option>
                <option value="backtracking">Backtracking</option>
                <option value="stack">Stack</option>
                <option value="queue">Queue</option>
                <option value="heap">Heap</option>
                <option value="linked list">Linked List</option>
                <option value="math">Math</option>
                <option value="bit manipulation">Bit Manipulation</option>
                <option value="recursion">Recursion</option>
                <option value="hash table">Hash Table</option>
                <option value="sliding window">Sliding Window</option>
                <option value="two pointers">Two Pointers</option>
                <option value="binary search">Binary Search</option>
                <option value="sorting">Sorting</option>
                <option value="divide and conquer">Divide and Conquer</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Status</span>
              </label>
              <select
                className="select select-bordered"
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
              >
                <option value="all">All</option>
                <option value="solved">Solved</option>
                <option value="unsolved">Unsolved</option>
              </select>
            </div>
          </div>
        </div>

        {/* Problems Table */}
        <div className="overflow-x-auto bg-base-200 rounded-lg shadow-md">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Status</th>
                <th>Title</th>
                <th>Difficulty</th>
                <th>Tags</th>
              </tr>
            </thead>
            <tbody>
              {filteredProblems.map((problem) => {
                const isSolved = solvedProblems.some(
                  (sp) => sp._id === problem._id
                );
                return (
                  <tr
                    key={problem._id}
                    className="hover:bg-base-300 cursor-pointer"
                    onClick={() => navigate(`/problem/${problem._id}`)}
                  >
                    <td>
                      {isSolved ? (
                        <div className="badge badge-success">Solved</div>
                      ) : (
                        <div className="badge badge-outline">Unsolved</div>
                      )}
                    </td>
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
                  </tr>
                );
              })}

              {filteredProblems.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-8">
                    No problems match your filters.
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
