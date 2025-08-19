import axios from "axios";
import { auth } from "@/config/auth";

const http = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
  timeout: 5000,
});
console.log(import.meta.env.VITE_BASE_URL);
http.interceptors.request.use((config) => {
  const { needToken } = config;
  console.log("config", config);
  config.headers["Content-Type"] = "application/json";
  if (needToken) {
    config.headers.Authorization = `Bearer ${auth}`;
  }
  return config;
});

http.interceptors.response.use((response) => {
  console.log("response", response);
  return response.data;
});

export default http;
