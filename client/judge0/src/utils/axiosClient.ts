import axios from "axios";

export const axiosClient = axios.create({
  baseURL: import.meta.env.BASE_URL,
  withCredentials: true, // cookies are sent with requests
  headers: {
    "Content-Type": "application/json",
  },
});
