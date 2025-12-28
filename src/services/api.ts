// src/services/api.ts
import axios from "axios";

const api = axios.create({
  // baseURL: "https://conteosapi.zdevs.uk", // ✔ tu backend prod
  // baseURL: "http://localhost:3411", // ✔ tu backend dev
  baseURL: import.meta.env.VITE_API_URL,

});

// 👉 Interceptor para enviar token automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
