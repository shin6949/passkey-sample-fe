import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios";

const axiosInstance = axios.create({
  // baseURL: process.env.REACT_APP_API_BASE_URL || "http://localhost:8080/api",
  timeout: 10000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    "X-Custom-Header": "uptime-dashboard",
  },
  validateStatus: function (status) {
    return status >= 200 && status < 600 && status !== 401;
  },
});

axiosInstance.interceptors.request.use(
  config => {
    // Refresh 엔드포인트 요청 시 헤더에서 Authorization 제거
    if (
      config.url?.includes("/auth/refresh") ||
      config.url?.includes("/auth/logout")
    ) {
      delete config.headers.Authorization;
      return config;
    }

    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    localStorage.removeItem("accessToken");
    return Promise.reject(error);
  },
);

declare module "axios" {
  interface AxiosRequestConfig {
    skipAuthRefresh?: boolean;
  }
}

interface FailedQueueItem {
  resolve: (value?: unknown) => void;
  reject: (error?: unknown) => void;
}

let isRefreshing = false;
let failedQueue: FailedQueueItem[] = [];

const processQueue = (
  error?: AxiosError,
  token: string | null = null,
): void => {
  failedQueue.forEach(prom => {
    if (error) {
      console.log("에러 객체 구조:", Object.keys(error));
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

interface CustomRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    console.error("Error:", error);
    const originalRequest = error.config as CustomRequestConfig;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.skipAuthRefresh
    ) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({
            resolve: resolve as (value?: unknown) => void,
            reject,
          });
        })

          .then(() => axiosInstance(originalRequest))
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();

        delete axiosInstance.defaults.headers.common.Authorization;
        axiosInstance.defaults.headers.common = {
          ...axiosInstance.defaults.headers.common,
          Authorization: `Bearer ${newToken}`,
        };
        localStorage.setItem("accessToken", newToken);
        if (originalRequest.headers) {
          originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
        }

        processQueue(undefined, newToken);
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("accessToken");
        window.location.href = "/login";
        processQueue(refreshError as AxiosError);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

const refreshAccessToken = () => {
  return axiosInstance
    .post("/api/auth/refresh")
    .then(res => {
      return res.data.data.accessToken;
    })
    .catch(err => {
      console.error("[Refresh] Error:", err);
      throw err;
    });
};

export default axiosInstance;
