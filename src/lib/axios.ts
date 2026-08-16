import axios from "axios";
import { getAuthToken, setAuthToken } from "@/lib/authToken";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  // Send the HttpOnly session cookie on cross-origin requests (the primary auth mechanism).
  withCredentials: true,
  // Never let a hung backend leave a spinner (checkout "Placing order…", cart loader) spinning
  // forever — fail the request so the UI can show an error and let the user retry.
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  // Bearer fallback from the in-memory token (not localStorage). If it's absent — e.g. after a
  // full reload — the HttpOnly cookie above still authenticates the request.
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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
        setAuthToken(null);                          // drop the in-memory Bearer
        localStorage.removeItem("shopnow-auth");     // zustand persist blob (authStore)
        // The JWT itself is an HttpOnly cookie the browser can't clear from JS — ask the backend
        // to expire it. Best-effort (fire-and-forget); the stale cookie is harmless once expired.
        fetch(`${API_URL}/api/auth/logout`, { method: "POST", credentials: "include" }).catch(() => {});
        window.location.href = "/auth/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
