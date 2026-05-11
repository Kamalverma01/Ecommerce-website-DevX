import axios from "axios";

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/api/auth-ext`;

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

export const authApi = {
  register: (payload) => api.post("/register", payload),
  sendOtp: (payload) => api.post("/send-otp", payload),
  verifyOtp: (payload) => api.post("/verify-otp", payload),
  login: (payload) => api.post("/login", payload),
  loginWithGoogle: (payload) => api.post("/google", payload),
  forgotPassword: (payload) => api.post("/forgot-password", payload),
  resetPassword: (payload) => api.post("/reset-password", payload),
  refresh: (payload = {}) => api.post("/refresh", payload),
  logout: () => api.post("/logout"),
  logoutAll: () => api.post("/logout-all"),
  sessions: () => api.get("/sessions"),
};

export default api;
