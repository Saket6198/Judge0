import Editor from "@monaco-editor/react";
import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { toast } from "react-toastify";
import { axiosClient } from "../utils/axiosClient";
import canvaSvg from "../assets/canva.svg";

interface Problem {
  _id: string;
  title: string;
  description: string;
  tags: string[];
  difficulty: string;
  visibleTestCases: Array<{
    input: string;
    output: string;
    explanation: string;
    _id: string;
  }>;
  startCode: Array<{
    language: string;
    initialCode: string;
    _id: string;
  }>;
  referenceSolution: Array<{
    language: string;
    solution: string;
    _id: string;
  }>;
}

interface TestResult {
  source_code: string;
  language_id: number;
  stdin: string;
  expected_output: string;
  stdout: string;
  status_id: number;
  status: {
    id: number;
    description: string;
  };
  time: string;
  memory: number;
  stderr?: string;
}

interface SubmissionResult {
  _id: string;
  userId: string;
  problemId: string;
  code: string;
  language: string;
  status: "pending" | "accepted" | "wrong" | "error";
  runtime: number;
  memory: number;
  errorMessage?: string;
  testCasesPassed: number;
  testCasesTotal: number;
  createdAt: string;
  updatedAt: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function ProblemPage() {
  const [problem, setProblem] = useState<Problem | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState("c++");
  const [leftActiveTab, setLeftActiveTab] = useState(0);
  const [rightActiveTab, setRightActiveTab] = useState(0);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [submissionResults, setSubmissionResults] = useState<
    SubmissionResult[]
  >([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentCode, setCurrentCode] = useState(""); // Store current editor content
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const editorRef = useRef<any>(null);
  const { problemById } = useParams<{ problemById: string }>();
  const navigate = useNavigate();

  // Language mapping for Monaco Editor
  const languageMapping: { [key: string]: string } = {
    "c++": "cpp",
    c: "c",
    java: "java",
    python: "python",
    javascript: "javascript",
    python3: "python",
    js: "javascript",
  };

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get(
          `/problem/problemById/${problemById}`
        );
        setProblem(response.data);
        // Set default language if available
        if (response.data.startCode && response.data.startCode.length > 0) {
          setSelectedLanguage(response.data.startCode[0].language);
          // Initialize current code with the start code
          setCurrentCode(response.data.startCode[0].initialCode);
        }
      } catch (error: any) {
        console.error("Error fetching problem:", error);
        if (error.response?.status === 404) {
          toast.error(
            "❌ Problem not found. It may have been removed or the URL is incorrect."
          );
        } else if (error.response?.status >= 500) {
          toast.error(
            "🔧 Server error while loading problem. Please try again later."
          );
        } else {
          toast.error("❌ Failed to load problem. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    const fetchPreviousSubmissions = async () => {
      try {
        const response = await axiosClient.get(
          `/submission/submittedProblem/${problemById}`
        );
        // Backend now returns empty array instead of 404 for no submissions
        if (response.data.ans && response.data.ans.length > 0) {
          // Sort by creation date, most recent first
          const sortedSubmissions = response.data.ans.sort(
            (a: SubmissionResult, b: SubmissionResult) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setSubmissionResults(sortedSubmissions);
          setHasSubmitted(true);
        } else {
          // No submissions yet - this is normal for unsolved problems
          console.log("No previous submissions found for this problem");
          setSubmissionResults([]);
          setHasSubmitted(false);
        }
      } catch (error: any) {
        // Only handle actual errors now (network issues, server errors, etc.)
        console.error("Error fetching previous submissions:", error);
        if (error.response?.status >= 500) {
          toast.error(
            "🔧 Server error while loading submission history. Please try again later."
          );
        } else if (error.response?.status === 401) {
          toast.error("🔒 Authentication required. Please log in again.");
        }
      }
    };

    if (problemById) {
      fetchProblem();
      fetchPreviousSubmissions();
    }
  }, [problemById]);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;

    // Set up content change listener to preserve code when switching tabs
    editor.onDidChangeModelContent(() => {
      setCurrentCode(editor.getValue());
    });
  };

  const getCurrentCode = () => {
    return editorRef.current?.getValue() || currentCode || "";
  };

  const getMonacoLanguage = () => {
    return languageMapping[selectedLanguage.toLowerCase()] || "javascript";
  };

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);

    // Set the starter code for the new language
    if (problem) {
      const lang = problem.startCode.find((l) => l.language === language);
      if (lang) {
        setCurrentCode(lang.initialCode);
      }
    }
  };

  const runCode = async () => {
    if (!problemById || !editorRef.current) return;

    setIsRunning(true);
    try {
      const response = await axiosClient.post(
        `/submission/run/${problemById}`,
        {
          language: selectedLanguage,
          code: getCurrentCode(),
        }
      );

      console.log("Run response:", response.data); // Debug log
      // API returns {success, testCases, runtime, memory} structure
      setTestResults(response.data.testCases || []);
      setHasRun(true);
      setRightActiveTab(1); // Switch to Test Cases tab
    } catch (error: any) {
      console.error("Error running code:", error);

      if (error.response?.status === 429) {
        toast.error(
          "You are submitting too frequently! Please try again later"
        );
      } else if (error.response?.status === 404) {
        toast.error(
          "❌ Problem not found. Please refresh the page and try again."
        );
      } else if (error.response?.status >= 500) {
        toast.error("🔧 Server error. Please try again in a few moments.");
      } else {
        toast.error(
          "❌ Failed to run code. Please check your solution and try again."
        );
      }
    } finally {
      setIsRunning(false);
    }
  };

  const submitCode = async () => {
    if (!problemById || !editorRef.current) return;

    setIsSubmitting(true);
    try {
      console.log("Submitting code:", {
        problemById,
        language: selectedLanguage,
        code: getCurrentCode(),
      });

      const response = await axiosClient.post(
        `/submission/submit/${problemById}`,
        {
          language: selectedLanguage,
          code: getCurrentCode(),
        }
      );

      console.log("Submit response:", response.data);

      // After successful submission, fetch updated submissions list
      const submissionsResponse = await axiosClient.get(
        `/submission/submittedProblem/${problemById}`
      );

      if (
        submissionsResponse.data.ans &&
        submissionsResponse.data.ans.length > 0
      ) {
        // Sort by creation date, most recent first
        const sortedSubmissions = submissionsResponse.data.ans.sort(
          (a: SubmissionResult, b: SubmissionResult) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setSubmissionResults(sortedSubmissions);
        setHasSubmitted(true);
        setRightActiveTab(2); // Switch to Results tab
      }
    } catch (error: any) {
      console.error("Error submitting code:", error);
      console.error("Error response:", error.response?.data);

      if (error.response?.status === 429) {
        toast.error(
          "⏳ Rate limit exceeded! Please wait before submitting again."
        );
      } else if (error.response?.status === 404) {
        toast.error(
          "❌ Problem not found. Please refresh the page and try again."
        );
      } else if (error.response?.status >= 500) {
        toast.error("🔧 Server error. Please try again in a few moments.");
      } else if (error.response?.status === 400) {
        toast.error(
          "❌ Invalid submission. Please check your code and try again."
        );
      } else {
        toast.error("❌ Failed to submit code. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendChatMessage = async (message: string) => {
    if (!message.trim() || !problem || !problemById) return;

    // Add user message to chat
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const response = await axiosClient.post(`/chat/message`, {
        message: message,
        problemId: problemById,
        currentCode: getCurrentCode(),
        language: selectedLanguage,
        testCases: problem.visibleTestCases,
        problemTitle: problem.title,
        problemDescription: problem.description,
      });

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.data.response,
        timestamp: new Date(),
      };

      setChatMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error("Error sending chat message:", error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "Sorry, I'm having trouble responding right now. Please try again later.",
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, errorMessage]);

      if (error.response?.status === 429) {
        toast.error(
          "⏳ Chat rate limit exceeded! Please wait before sending another message."
        );
      } else if (error.response?.status >= 500) {
        toast.error(
          "🔧 Chat service temporarily unavailable. Please try again later."
        );
      } else {
        toast.error("❌ Failed to send message. Please try again.");
      }
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendChatMessage(chatInput);
  };

  const leftTabs = ["Description", "Solutions", "Chat With AI"];
  const rightTabs = ["Code", "Test Cases", "Results"];

  const renderLeftContent = () => {
    if (!problem) return <div className="p-4">Loading...</div>;

    switch (leftActiveTab) {
      case 0: // Description
        return (
          <div className="p-4 overflow-y-auto">
            <h1 className="text-2xl font-bold mb-4">{problem.title}</h1>
            <div className="prose prose-invert max-w-none mb-6">
              <div dangerouslySetInnerHTML={{ __html: problem.description }} />
            </div>

            <h3 className="text-lg font-semibold mb-3">Test Cases</h3>
            {problem.visibleTestCases.map((testCase, index) => (
              <div key={index} className="mb-4 p-3 bg-gray-800 rounded">
                <div className="mb-2">
                  <strong>Input:</strong>
                  <pre className="bg-gray-900 p-2 rounded mt-1 text-sm">
                    {testCase.input}
                  </pre>
                </div>
                <div>
                  <strong>Output:</strong>
                  <pre className="bg-gray-900 p-2 rounded mt-1 text-sm">
                    {testCase.output}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        );
      case 1: // Solutions
        return (
          <div className="p-4 overflow-y-auto max-h-screen">
            <h2 className="text-xl font-bold mb-4">Reference Solutions</h2>
            {problem.referenceSolution?.map((solution, index) => (
              <div key={index} className="mb-6">
                <h3 className="text-lg font-semibold mb-2">
                  {solution.language}
                </h3>
                <pre className="bg-gray-800 p-4 rounded overflow-x-auto text-sm">
                  <code>{solution.solution}</code>
                </pre>
              </div>
            )) || (
              <div className="text-gray-400">
                No reference solutions available.
              </div>
            )}
          </div>
        );
      case 2: // Chat With AI
        return (
          <div className="flex flex-col overflow-y-auto max-h-screen  ">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-700">
              <h2 className="text-xl font-bold mb-2">AI Coding Assistant</h2>
              <p className="text-sm text-gray-400">
                Ask questions about this problem, get coding hints, or discuss
                your solution approach.
              </p>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <div className="mb-4">
                    <svg
                      className="w-12 h-12 mx-auto mb-2 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <p className="text-lg font-medium mb-2">
                    Start a conversation!
                  </p>
                  <p className="text-sm">
                    I have context about this problem, its test cases, and your
                    current code. Ask me anything to help you solve it!
                  </p>
                </div>
              ) : (
                chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-800 text-gray-100"
                      }`}
                    >
                      <div className="text-sm mb-1">
                        {message.role === "user" ? "You" : "AI Assistant"}
                      </div>
                      <div className="whitespace-pre-wrap break-words">
                        {message.content}
                      </div>
                      <div
                        className={`text-xs mt-2 ${
                          message.role === "user"
                            ? "text-blue-200"
                            : "text-gray-400"
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))
              )}

              {/* Loading indicator */}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-800 text-gray-100 p-3 rounded-lg max-w-[80%]">
                    <div className="text-sm mb-1">AI Assistant</div>
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-400">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-gray-700">
              <form onSubmit={handleChatSubmit} className="flex space-x-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about the problem, algorithm approach, debugging help..."
                  className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  disabled={isChatLoading}
                />
                <button
                  type="submit"
                  disabled={isChatLoading || !chatInput.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {isChatLoading ? (
                    <svg
                      className="w-4 h-4 animate-spin"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                  )}
                </button>
              </form>
              <div className="text-xs text-gray-500 mt-2">
                💡 I can help with algorithm ideas, debugging, code review, and
                problem-solving strategies.
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderRightContent = () => {
    if (!problem) return <div className="p-4">Loading...</div>;

    switch (rightActiveTab) {
      case 0: // Code
        if (!problem || !problem.startCode || problem.startCode.length === 0) {
          return (
            <div className="p-4 text-center text-gray-400">
              Loading code editor...
            </div>
          );
        }
        return (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-3 border-b border-gray-700">
              <select
                value={selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="bg-gray-800 border border-gray-600 rounded px-3 py-1"
              >
                {problem?.startCode && problem.startCode.length > 0 ? (
                  problem.startCode.map((lang) => (
                    <option key={lang.language} value={lang.language}>
                      {lang.language}
                    </option>
                  ))
                ) : (
                  <option>Loading languages...</option>
                )}
              </select>
              <div className="flex gap-2">
                <button
                  onClick={runCode}
                  disabled={isRunning}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-1 rounded"
                >
                  {isRunning ? "Running..." : "Run"}
                </button>
                <button
                  onClick={submitCode}
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-1 rounded"
                >
                  {isSubmitting ? "Submitting..." : "Submit"}
                </button>
              </div>
            </div>
            <div className="flex-1">
              <Editor
                key={selectedLanguage} // Force re-render when language changes
                theme="vs-dark"
                height="100%"
                language={getMonacoLanguage()}
                value={currentCode}
                onMount={handleEditorDidMount}
                onChange={(value) => {
                  if (value !== undefined) {
                    setCurrentCode(value);
                  }
                }}
                options={{
                  fontSize: 14,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  contextmenu: false, // Disable right-click menu to prevent clipboard issues
                  copyWithSyntaxHighlighting: false, // Disable syntax highlighting in clipboard
                }}
              />
            </div>
          </div>
        );
      case 1: // Test Cases
        return (
          <div className="flex flex-col overflow-y-auto max-h-screen">
            <h3 className="text-lg font-semibold mb-3 p-4 pb-0">
              Test Case Results
            </h3>
            <div className="flex-1  px-4 pb-4">
              {!hasRun ? (
                <div className="text-gray-400 text-center py-8">
                  Click "Run" to test your code with test cases
                </div>
              ) : (
                <div>
                  {testResults && testResults.length > 0 ? (
                    testResults.map((result, index) => (
                      <div
                        key={index}
                        className="mb-4 p-3 border border-gray-700 rounded"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold">
                            Test Case {index + 1}
                          </span>
                          <span
                            className={`px-2 py-1 rounded text-sm ${
                              result.status.description === "Accepted"
                                ? "bg-green-800 text-green-200"
                                : "bg-red-800 text-red-200"
                            }`}
                          >
                            {result.status.description}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <strong>Input:</strong>
                            <pre className="bg-gray-800 p-2 rounded mt-1">
                              {result.stdin}
                            </pre>
                          </div>
                          <div>
                            <strong>Expected:</strong>
                            <pre className="bg-gray-800 p-2 rounded mt-1">
                              {result.expected_output}
                            </pre>
                          </div>
                          <div>
                            <strong>Output:</strong>
                            <pre className="bg-gray-800 p-2 rounded mt-1">
                              {result.stdout || "No output"}
                            </pre>
                          </div>
                          <div>
                            <strong>Runtime:</strong>
                            <span className="ml-2">
                              {result.time}s | {result.memory} KB
                            </span>
                          </div>
                        </div>
                        {result.stderr && (
                          <div className="mt-2">
                            <strong className="text-red-400">Error:</strong>
                            <pre className="bg-red-900 p-2 rounded mt-1 text-red-200">
                              {result.stderr}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-400 text-center py-8">
                      No test results available
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      case 2: // Results
        return (
          <div className="flex flex-col overflow-y-auto max-h-screen">
            <h3 className="text-lg font-semibold mb-3 p-4 pb-0">
              Submission Results
            </h3>
            <div className="flex-1 overflow-y-auto max-h-screen px-4 pb-4">
              {!hasSubmitted ? (
                <div className="text-gray-400 text-center py-8">
                  Submit your solution to see results
                </div>
              ) : (
                <div>
                  {submissionResults.map((result, index) => (
                    <div
                      key={index}
                      className="mb-4 p-3 border border-gray-700 rounded"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="font-semibold">
                            Submission {index + 1}
                          </span>
                          <div className="text-xs text-gray-400 mt-1">
                            {new Date(result.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-sm ${
                            result.status === "accepted"
                              ? "bg-green-800 text-green-200"
                              : "bg-red-800 text-red-200"
                          }`}
                        >
                          {result.status === "accepted"
                            ? "Accepted"
                            : result.status === "wrong"
                            ? "Wrong Answer"
                            : result.status === "error"
                            ? "Error"
                            : "Pending"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong>Test Cases:</strong>
                          <span className="ml-2">
                            {result.testCasesPassed}/{result.testCasesTotal}
                          </span>
                        </div>
                        <div>
                          <strong>Runtime:</strong>
                          <span className="ml-2">{result.runtime}s</span>
                        </div>
                        <div>
                          <strong>Memory:</strong>
                          <span className="ml-2">{result.memory} KB</span>
                        </div>
                        <div>
                          <strong>Language:</strong>
                          <span className="ml-2">{result.language}</span>
                        </div>
                      </div>
                      {result.errorMessage && (
                        <div className="mt-2">
                          <strong className="text-red-400">Error:</strong>
                          <pre className="bg-red-900 p-2 rounded mt-1 text-red-200 text-sm">
                            {result.errorMessage}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen items-center justify-center flex flex-col gap-3">
        <img
          src={canvaSvg}
          alt="judge0-loading-icon"
          width={60}
          height={60}
          className="animate-bounce"
        />
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-xl">Problem not found</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      {/* Header with back button */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Problems
        </button>
        <h1 className="text-xl font-semibold">{problem.title}</h1>
        <div className="w-32"></div> {/* Spacer for centering */}
      </div>

      {/* Main content */}
      <div className="flex-1 flex">
        {/* Left Panel */}
        <div className="w-1/2 border-r border-gray-700 flex flex-col">
          {/* Left Tabs */}
          <div className="flex border-b border-gray-700">
            {leftTabs.map((tab, index) => (
              <button
                key={tab}
                onClick={() => setLeftActiveTab(index)}
                className={`px-4 py-2 ${
                  leftActiveTab === index
                    ? "bg-gray-800 border-b-2 border-blue-500"
                    : "hover:bg-gray-800"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          {/* Left Content */}
          <div className="flex-1 overflow-hidden">{renderLeftContent()}</div>
        </div>

        {/* Right Panel */}
        <div className="w-1/2 flex flex-col">
          {/* Right Tabs */}
          <div className="flex border-b border-gray-700">
            {rightTabs.map((tab, index) => (
              <button
                key={tab}
                onClick={() => setRightActiveTab(index)}
                className={`px-4 py-2 ${
                  rightActiveTab === index
                    ? "bg-gray-800 border-b-2 border-blue-500"
                    : "hover:bg-gray-800"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          {/* Right Content */}
          <div className="flex-1 overflow-hidden">{renderRightContent()}</div>
        </div>
      </div>
    </div>
  );
}
