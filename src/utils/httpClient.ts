/**
 * HTTP 클라이언트 유틸리티
 *
 * 역할: API 요청 및 자동 토큰 갱신 처리
 * 위치: app/utils/httpClient.ts
 */

// API 베이스 URL (직접 백엔드 서버로 요청)
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

interface RefreshResponse {
  status: number;
  message: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error("UNKNOWN_ERROR");
}

// 토큰 갱신 중 플래그 (중복 갱신 방지)

let isRefreshing = false;
// 갱신 대기 중인 요청들
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

/**
 * 대기 중인 요청 처리
 */
const processQueue = (error: Error | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve();
    }
  });
  failedQueue = [];
};

/**
 * 토큰 갱신 API 호출
 *
 * @returns {Promise<boolean>} 갱신 성공 여부
 */
export async function refreshTokens(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/open-api/auth/refresh`, {
      method: "POST",
      credentials: "include", // 쿠키에 있는 refreshToken 자동 포함
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("토큰 갱신 실패");
    }

    const rawData: unknown = await response.json();
    if (!isRecord(rawData) || typeof rawData.status !== "number") {
      throw new Error("토큰 갱신 응답 형식 오류");
    }
    const data: RefreshResponse = {
      status: rawData.status,
      message: typeof rawData.message === "string" ? rawData.message : "",
    };

    // status 0이면 성공
    if (data.status === 0) {
      return true;
    }

    throw new Error(data.message || "토큰 갱신 실패");
  } catch (error: unknown) {
    console.error("토큰 갱신 에러:", error);
    return false;
  }
}

/**
 * HTTP 요청 (자동 토큰 갱신 포함)
 *
 * @param url - 요청 URL (상대 경로)
 * @param options - fetch options
 * @returns {Promise<Response>} fetch Response
 */
export async function httpClient(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  // 전체 URL 생성 (백엔드 서버로 직접 요청)
  const fullUrl = `${API_BASE_URL}${url}`;

  // 기본 옵션: 쿠키 포함
  const config: RequestInit = {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };

  // 첫 번째 요청
  const response = await fetch(fullUrl, config);

  // 401 에러가 아니면 바로 반환
  if (response.status !== 401) {
    return response;
  }

  // 401 에러인 경우, Custom Status 확인
  const clonedResponse = response.clone();
  try {
    const body: unknown = await clonedResponse.json();
    // Custom Status가 3003 (AccessToken 만료)이 아니면 토큰 갱신하지 않고 바로 반환
    if (!isRecord(body) || body.status !== 3003) {
      return response;
    }
  } catch {
    // JSON 파싱 실패 시 원본 반환
    return response;
  }

  // 401 에러 + Custom Status 3003 - 토큰 갱신 필요
  // 이미 갱신 중이라면 대기
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    }).then(() => {
      // 갱신 완료 후 재시도
      return fetch(fullUrl, config);
    });
  }

  // 토큰 갱신 시작
  isRefreshing = true;

  try {
    const refreshSuccess = await refreshTokens();

    if (!refreshSuccess) {
      processQueue(new Error("토큰 갱신 실패"));
      // 홈으로 리다이렉트
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
      throw new Error("토큰 갱신 실패");
    }

    // 갱신 성공 - 대기 중인 요청들 처리
    processQueue();

    // 원래 요청 재시도
    return fetch(fullUrl, config);
  } catch (error: unknown) {
    const normalizedError = toError(error);
    processQueue(normalizedError);
    throw normalizedError;
  } finally {
    isRefreshing = false;
  }
}

/**
 * GET 요청
 */
export async function httpGet<T>(url: string): Promise<T> {
  const response = await httpClient(url, { method: "GET" });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * POST 요청
 */
export async function httpPost<T>(url: string, data?: unknown): Promise<T> {
  const response = await httpClient(url, {
    method: "POST",
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * PUT 요청
 */
export async function httpPut<T>(url: string, data?: unknown): Promise<T> {
  const response = await httpClient(url, {
    method: "PUT",
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * DELETE 요청
 */
export async function httpDelete<T>(url: string): Promise<T> {
  const response = await httpClient(url, { method: "DELETE" });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}
