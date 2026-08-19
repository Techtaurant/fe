/**
 * HTTP 클라이언트 유틸리티
 *
 * 역할: API 요청 및 자동 토큰 갱신 처리
 * 위치: src/utils/httpClient.ts
 */

// API 베이스 URL (직접 백엔드 서버로 요청)
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

let isRefreshing: Promise<boolean> | null = null;

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

  let response = await fetch(fullUrl, config);

  if (response.status === 401) {
    const bodyStatusCode = await response
      .clone()
      .json()
      .then((body: unknown) =>
        isRecord(body) && typeof body.status === "number"
          ? body.status
          : undefined,
      )
      .catch(() => undefined);

    if ([3003, 3008].includes(bodyStatusCode ?? -1)) {
      if (!isRefreshing) {
        isRefreshing = fetch(`${API_BASE_URL}/open-api/auth/refresh`, {
          method: "POST",
          credentials: "include",
        })
          .then((refreshResponse) => refreshResponse.ok)
          .finally(() => {
            isRefreshing = null;
          });
      }

      if (await isRefreshing) {
        response = await fetch(fullUrl, config);
      }
    }
  }

  return response;
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
