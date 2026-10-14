import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Auto attach token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("apnagit_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle unauth
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Optional: Handle token expiration
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  signup: (userData) => api.post("/signup", userData),
  sendOtp: (data) => api.post("/send-otp", data),
  verifyOtp: (data) => api.post("/verify-otp", data),
  resendOtp: (data) => api.post("/resend-otp", data),
  login: (credentials) => api.post("/login", credentials),
  getUserProfile: (userId) => api.get(`/userProfile/${userId}`),
  updateUserProfile: (userId, data) => api.put(`/updateUser/${userId}`, data),
  getAllUsers: () => api.get("/allUsers"),
};

export const repoApi = {
  create: (repoData) => api.post("/repo/create", repoData),
  getAll: () => api.get("/repo/all"),
  getById: (id) => api.get(`/repo/${id}`),
  getByName: (name) => api.get(`/repo/name/${name}`),
  getUserRepos: (userId) => api.get(`/repo/user/${userId}`),
  update: (id, data) => api.put(`/repo/update/${id}`, data),
  toggleVisibility: (id) => api.patch(`/repo/toggle/${id}`),
  delete: (id) => api.delete(`/repo/delete/${id}`),
  getFileContent: (repoId, fileName) =>
    api.get(`/repo/${repoId}/file/${encodeURIComponent(fileName)}`),
};

export const issueApi = {
  create: (issueData) => api.post("/issue/create", issueData),
  getAll: () => api.get("/issue/all"),
  getById: (id) => api.get(`/issue/${id}`),
  update: (id, data) => api.put(`/issue/update/${id}`, data),
  delete: (id) => api.delete(`/issue/delete/${id}`),
};

export default api;
