import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.MODE === "development" ? "https://back-test-production-ab3a.up.railway.app//api" : "/api",
  withCredentials: true,
});
