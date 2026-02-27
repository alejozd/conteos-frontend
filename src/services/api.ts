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
  const empresaIdSeleccionada = localStorage.getItem("empresa_seleccionada_id");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Si existe una empresa seleccionada, la enviamos en un header personalizado
  if (empresaIdSeleccionada) {
    config.headers["x-empresa-id"] = empresaIdSeleccionada;
  }

  return config;
});

// Interceptor para manejar errores globales (ej: 401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/";
    }
    return Promise.reject(error);
  },
);

export default api;
