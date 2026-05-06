export type FollowApiErrorCode =
  | "UNAUTHORIZED"
  | "BAD_REQUEST"
  | "NOT_FOUND"
  | "CONFLICT"
  | "HTTP_ERROR";

interface FollowApiErrorOptions {
  status: number;
  message?: string;
}

export class FollowApiError extends Error {
  readonly code: FollowApiErrorCode;

  readonly status: number;

  constructor(code: FollowApiErrorCode, options: FollowApiErrorOptions) {
    super(options.message || code);
    this.name = "FollowApiError";
    this.code = code;
    this.status = options.status;
  }
}

export function isFollowApiError(error: unknown): error is FollowApiError {
  return error instanceof FollowApiError;
}
