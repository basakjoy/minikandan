import axios, { AxiosError } from 'axios';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://minikandan.onrender.com/api'
    : 'http://localhost:4000/api');

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) {
    return fallback;
  }

  if (!error.response) {
    return 'Unable to connect to the API. Please try again.';
  }

  const responseMessage = (error as AxiosError<{ message?: string | string[] }>).response?.data?.message;
  if (Array.isArray(responseMessage)) {
    return responseMessage.join(' ');
  }

  return responseMessage || fallback;
}

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('kanban_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // If unauthorized on protected route, clear token
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register') {
        localStorage.removeItem('kanban_token');
        localStorage.removeItem('kanban_user');
      }
    }
    return Promise.reject(error);
  },
);
