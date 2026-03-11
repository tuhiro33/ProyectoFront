import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://localhost:8080", // tu backend
  withCredentials: false, // true solo si usas cookies
  headers: {
    "Content-Type": "application/json",
  },
});

// Agrega token automático desde localStorage
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

export default apiClient;