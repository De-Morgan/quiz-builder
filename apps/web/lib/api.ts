import axios from "axios";

import { clearToken, getToken } from "./token";

// The shared axios instance. Exported as `http` so call sites can import the
// path map (`api`) from `./endpoints` alongside it without a name clash.
export const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
});

http.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export type ApiError = { status: number; message: string; raw?: unknown };

export const UNAUTHORIZED_EVENT = "qb:unauthorized";

http.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status ?? 0;
    const rawMessage =
      error.response?.data?.message ?? error.message ?? "Request failed";

    if (status === 401) {
      clearToken();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
      }
    }

    const apiError: ApiError = {
      status,
      message: Array.isArray(rawMessage) ? rawMessage.join(", ") : rawMessage,
      raw: error.response?.data,
    };
    return Promise.reject(apiError);
  },
);
