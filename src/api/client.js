import axios from "axios";
import {
  AUTH_LOGIN_NOTICE_KEY,
  AUTH_NOTICE_SESSION_EXPIRED,
} from "../constants/authLoginNotice";

const baseURL = import.meta.env.VITE_API_URL ?? "";

/**
 * Chemin relatif au baseURL pour renouveler l’access token (SimpleJWT / équivalent).
 * Surcharge si besoin : VITE_AUTH_REFRESH_PATH=/accounts/admin/token/refresh/
 */
const AUTH_REFRESH_PATH =
  import.meta.env.VITE_AUTH_REFRESH_PATH ?? "/accounts/token/refresh/";

const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

/** Requêtes publiques : ne pas tenter un refresh sur 401 */
function isAuthExemptRequest(config) {
  const path = config?.url ?? "";
  const joined = `${config?.baseURL ?? ""}${path}`;
  const haystack = `${joined} ${path}`.toLowerCase();
  return (
    haystack.includes("admin/login") ||
    haystack.includes("forgot-password") ||
    haystack.includes("reset-password") ||
    haystack.includes(AUTH_REFRESH_PATH.replace(/^\//, "").toLowerCase())
  );
}

let refreshInFlight = null;

async function refreshAccessToken() {
  if (refreshInFlight) return refreshInFlight;

  const refresh = localStorage.getItem("refresh");
  if (!refresh) {
    return Promise.reject(new Error("Pas de refresh token"));
  }

  const root = String(baseURL).replace(/\/+$/, "");
  const rel = AUTH_REFRESH_PATH.startsWith("/")
    ? AUTH_REFRESH_PATH
    : `/${AUTH_REFRESH_PATH}`;

  refreshInFlight = axios
    .post(
      `${root}${rel}`,
      { refresh },
      { headers: { "Content-Type": "application/json" }, timeout: 15000 },
    )
    .then((res) => {
      const access = res.data?.access ?? res.data?.token;
      if (!access) {
        throw new Error("Réponse refresh sans access token");
      }
      localStorage.setItem("token", access);
      if (res.data?.refresh) {
        localStorage.setItem("refresh", res.data.refresh);
      }
      return access;
    })
    .finally(() => {
      refreshInFlight = null;
    });

  return refreshInFlight;
}

function redirectToLoginSessionExpired() {
  try {
    sessionStorage.setItem(AUTH_LOGIN_NOTICE_KEY, AUTH_NOTICE_SESSION_EXPIRED);
  } catch {
    /* private mode, quota */
  }
  window.location.href = "/login";
}

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    const shouldTryRefresh =
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthExemptRequest(originalRequest) &&
      localStorage.getItem("refresh");

    if (shouldTryRefresh) {
      originalRequest._retry = true;
      try {
        await refreshAccessToken();
        const token = localStorage.getItem("token");
        if (token) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
        }
        return api(originalRequest);
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("refresh");
        localStorage.removeItem("admin");
        redirectToLoginSessionExpired();
        return Promise.reject(error);
      }
    }

    if (status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("refresh");
      localStorage.removeItem("admin");
      redirectToLoginSessionExpired();
    }

    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.response?.data?.error ||
      "Une erreur est survenue";

    return Promise.reject({ ...error, message });
  },
);

export default api;
