export type BanApiErrorCode =
  | "UNAUTHORIZED"
  | "BAD_REQUEST"
  | "NOT_FOUND"
  | "CONFLICT"
  | "HTTP_ERROR";

interface BanApiErrorOptions {
  status: number;
  message?: string;
}

export class BanApiError extends Error {
  readonly code: BanApiErrorCode;

  readonly status: number;

  constructor(code: BanApiErrorCode, options: BanApiErrorOptions) {
    super(options.message || code);
    this.name = "BanApiError";
    this.code = code;
    this.status = options.status;
  }
}

export function isBanApiError(error: unknown): error is BanApiError {
  return error instanceof BanApiError;
}
