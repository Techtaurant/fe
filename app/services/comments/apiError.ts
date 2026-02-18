export type CommentApiErrorCode =
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "BAD_REQUEST"
  | "HTTP_ERROR";

export type ValidationErrors = Record<string, string>;

export class CommentApiError extends Error {
  code: CommentApiErrorCode;
  status?: number;
  validationErrors?: ValidationErrors;

  constructor(
    code: CommentApiErrorCode,
    options?: {
      message?: string;
      status?: number;
      validationErrors?: ValidationErrors;
    },
  ) {
    super(options?.message || code);
    this.name = "CommentApiError";
    this.code = code;
    this.status = options?.status;
    this.validationErrors = options?.validationErrors;
  }
}

export function isCommentApiError(error: unknown): error is CommentApiError {
  return error instanceof CommentApiError;
}
