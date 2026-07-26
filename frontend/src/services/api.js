import axios from "axios";

// Buat instance axios dengan baseURL yang dinamis (mendukung Vercel & Localhost)
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5001/api",
});

// Interceptor untuk menyisipkan Token JWT otomatis di setiap request jika tersedia
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default API;
