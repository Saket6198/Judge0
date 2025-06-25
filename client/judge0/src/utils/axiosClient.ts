import axios from "axios";

export const axiosClient = axios.create({
  baseURL: "http://localhost:3000",
  withCredentials: true, // cookies are sent with requests
  headers: {
    "Content-Type": "application/json",
  },
});
