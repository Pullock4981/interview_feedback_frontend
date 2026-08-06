import axios from "axios";

// Create an Axios instance
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"}`,
  withCredentials: true, // Important for cookies/refresh tokens
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to attach JWT token if available in memory or local storage
// In a real app, you might use a React Context to manage this, but for simplicity:
apiClient.interceptors.request.use(
  (config) => {
    // const token = localStorage.getItem('accessToken');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling 401s (token refresh logic would go here)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle unauthorized errors (e.g., redirect to login or refresh token)
    if (error.response && error.response.status === 401) {
      if (typeof window !== "undefined") {
        // window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
