import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("shopnow_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// 401 = not authenticated (no token, or it expired/was tampered with) -> session is dead,
//       clear it and send the user to log in.
// 403 = authenticated but not allowed (e.g. a USER hitting an admin route) -> the session is
//       still valid, so do NOT log them out; let the caller show its own error.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      // The login/register calls themselves answer 401 on bad credentials. Redirecting here
      // would reload the page and destroy the error toast before the user could read it.
      const onAuthPage = window.location.pathname.startsWith("/auth/");
      if (!onAuthPage) {
        // The session lives in three places; clearing only the token leaves the UI
        // believing the user is still signed in after the reload.
        localStorage.removeItem("shopnow_token");   // raw JWT used by the request interceptor
        localStorage.removeItem("shopnow-auth");    // zustand persist blob (authStore)
        document.cookie = "shopnow-auth=;path=/;max-age=0"; // cookie middleware reads to gate /admin
        window.location.href = "/auth/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
