import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

// function to get the language ID based on the language name from judge0 API
// This function maps the language names to their respective IDs used by the Judge0 API.
const getLanguageById = (
  lang: "c" | "c++" | "java" | "javascript" | "python"
) => {
  const language = {
    c: 50,
    "c++": 54,
    java: 62,
    javascript: 63,
    python: 71,
  };
  return language[lang as keyof typeof language];
};

// Function to submit a batch of code submissions to the Judge0 API as batch submissions.
// This function is used to submit multiple code submissions at once for evaluation.
// It accepts an array of submissions, each containing source code, language ID, input, and expected output.
const submitBatch = async (submissions: any[]) => {
  const options = {
    method: "POST",
    url: "https://judge0-ce.p.rapidapi.com/submissions/batch",
    params: {
      base64_encoded: "false",
    },
    headers: {
      "x-rapidapi-key": process.env.JUDGE0_KEY,
      "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
      "Content-Type": "application/json",
    },
    data: {
      submissions,
    },
  };

  async function fetchData() {
    try {
      const response = await axios.request(options);
      return response.data;
    } catch (err: any) {
      throw new Error("Error in fetching data from Judge0 API: " + err.message);
    }
  }

  return await fetchData();
};

// function to wait for a specified amount of time (in milliseconds).
const waiting = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Function to submit a token to the Judge0 API for evaluation.
const submitToken = async (token: any[]) => {
  try {
    const options = {
      method: "GET",
      url: "https://judge0-ce.p.rapidapi.com/submissions/batch",
      params: {
        tokens: token.join(","),
        // The tokens parameter is a comma-separated list of submission tokens.
        base64_encoded: "false",
        fields: "*",
      },
      headers: {
        "x-rapidapi-key": process.env.JUDGE0_KEY,
        "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
      },
    };

    async function fetchData() {
      try {
        const response = await axios.request(options);
        return response.data;
      } catch (error: any) {
        throw new Error(
          "Error in fetching data from Judge0 API: " + error.message
        );
      }
    }
    while (true) {
      const result = await fetchData();
      const isResult = result.submissions.every(
        (res: any) => res.status_id > 2
      );
      if (isResult) {
        return result.submissions;
      }
      await waiting(1000); // Wait for 1 second before checking again
    }
  } catch (err: any) {
    throw new Error("Error in submitting token: " + err.message);
  }
};

export { getLanguageById, submitBatch, submitToken };
