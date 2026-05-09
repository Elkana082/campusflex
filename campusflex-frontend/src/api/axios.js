import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("cf_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If token expires, log user out
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("cf_token");
      localStorage.removeItem("cf_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;