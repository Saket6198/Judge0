import axios from "axios";

export const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true, // cookies are sent with requests
  headers: {
    "Content-Type": "application/json",
  },
});
