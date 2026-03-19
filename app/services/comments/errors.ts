import { isCommentApiError, ValidationErrors } from "./apiError";
import { redirectToOAuthLogin } from "@/app/lib/authRedirect";

export function redirectToGoogleLogin() {
  redirectToOAuthLogin();
}

function getErrorMessage(error: unknown) {
  if (isCommentApiError(error)) {
    return error.code;
  }
  return error instanceof Error ? error.message : "UNKNOWN";
}

function getValidationErrors(error: unknown): ValidationErrors | null {
  if (!isCommentApiError(error)) return null;
  if (error.code !== "BAD_REQUEST") return null;
  if (!error.validationErrors) return null;
  return error.validationErrors;
}

function getFirstValidationErrorMessage(errors: ValidationErrors) {
  const firstKey = Object.keys(errors)[0];
  if (!firstKey) return null;
  return errors[firstKey];
}

export interface FetchCommentsErrorResolution {
  shouldRedirectToLogin: boolean;
  alertMessage: string | null;
}

export interface CreateCommentErrorResolution {
  shouldRedirectToLogin: boolean;
  fieldErrors: ValidationErrors | null;
  alertMessage: string | null;
}

export interface UpdateCommentErrorResolution {
  shouldRedirectToLogin: boolean;
  fieldErrors: ValidationErrors | null;
  alertMessage: string | null;
}

export interface DeleteCommentErrorResolution {
  shouldRedirectToLogin: boolean;
  alertMessage: string | null;
}

export interface CommentLikeErrorResolution {
  shouldRedirectToLogin: boolean;
  alertMessage: string | null;
}

export function resolveFetchCommentsError(
  error: unknown,
): FetchCommentsErrorResolution {
  const message = getErrorMessage(error);

  if (message === "UNAUTHORIZED") {
    return {
      shouldRedirectToLogin: true,
      alertMessage: null,
    };
  }

  if (message === "NOT_FOUND") {
    return {
      shouldRedirectToLogin: false,
      alertMessage: "게시물을 찾을 수 없습니다.",
    };
  }

  if (message === "BAD_REQUEST") {
    const errors = getValidationErrors(error);
    const validationMessage = errors ? getFirstValidationErrorMessage(errors) : null;
    return {
      shouldRedirectToLogin: false,
      alertMessage: validationMessage || "댓글 목록 요청이 올바르지 않습니다.",
    };
  }

  return {
    shouldRedirectToLogin: false,
    alertMessage: "댓글을 불러오지 못했습니다.",
  };
}

export function resolveCreateCommentError(
  error: unknown,
): CreateCommentErrorResolution {
  const message = getErrorMessage(error);

  if (message === "UNAUTHORIZED") {
    return {
      shouldRedirectToLogin: true,
      fieldErrors: null,
      alertMessage: null,
    };
  }

  if (message === "NOT_FOUND") {
    return {
      shouldRedirectToLogin: false,
      fieldErrors: null,
      alertMessage: "게시물 또는 부모 댓글을 찾을 수 없습니다.",
    };
  }

  if (message === "BAD_REQUEST") {
    const errors = getValidationErrors(error);
    if (errors) {
      return {
        shouldRedirectToLogin: false,
        fieldErrors: errors,
        alertMessage: null,
      };
    }
    return {
      shouldRedirectToLogin: false,
      fieldErrors: null,
      alertMessage: "댓글 내용이 올바르지 않습니다.",
    };
  }

  return {
    shouldRedirectToLogin: false,
    fieldErrors: null,
    alertMessage: "댓글 작성에 실패했습니다.",
  };
}

export function resolveUpdateCommentError(
  error: unknown,
): UpdateCommentErrorResolution {
  const message = getErrorMessage(error);

  if (message === "UNAUTHORIZED") {
    return {
      shouldRedirectToLogin: true,
      fieldErrors: null,
      alertMessage: null,
    };
  }

  if (message === "FORBIDDEN") {
    return {
      shouldRedirectToLogin: false,
      fieldErrors: null,
      alertMessage: "댓글 작성자만 수정할 수 있습니다.",
    };
  }

  if (message === "NOT_FOUND") {
    return {
      shouldRedirectToLogin: false,
      fieldErrors: null,
      alertMessage: "댓글을 찾을 수 없습니다.",
    };
  }

  if (message === "GONE") {
    return {
      shouldRedirectToLogin: false,
      fieldErrors: null,
      alertMessage: "이미 삭제된 댓글입니다.",
    };
  }

  if (message === "BAD_REQUEST") {
    const errors = getValidationErrors(error);
    if (errors) {
      return {
        shouldRedirectToLogin: false,
        fieldErrors: errors,
        alertMessage: null,
      };
    }

    return {
      shouldRedirectToLogin: false,
      fieldErrors: null,
      alertMessage: "댓글 내용이 유효하지 않습니다.",
    };
  }

  return {
    shouldRedirectToLogin: false,
    fieldErrors: null,
    alertMessage: "댓글 수정에 실패했습니다.",
  };
}

export function resolveDeleteCommentError(
  error: unknown,
): DeleteCommentErrorResolution {
  const message = getErrorMessage(error);

  if (message === "UNAUTHORIZED") {
    return {
      shouldRedirectToLogin: true,
      alertMessage: null,
    };
  }

  if (message === "FORBIDDEN") {
    return {
      shouldRedirectToLogin: false,
      alertMessage: "댓글 작성자만 삭제할 수 있습니다.",
    };
  }

  if (message === "NOT_FOUND") {
    return {
      shouldRedirectToLogin: false,
      alertMessage: "댓글을 찾을 수 없습니다.",
    };
  }

  if (message === "GONE") {
    return {
      shouldRedirectToLogin: false,
      alertMessage: "이미 삭제된 댓글입니다.",
    };
  }

  return {
    shouldRedirectToLogin: false,
    alertMessage: "댓글 삭제에 실패했습니다.",
  };
}

export function resolveCommentLikeError(
  error: unknown,
): CommentLikeErrorResolution {
  const message = getErrorMessage(error);

  if (message === "UNAUTHORIZED") {
    return {
      shouldRedirectToLogin: true,
      alertMessage: null,
    };
  }

  if (message === "FORBIDDEN") {
    return {
      shouldRedirectToLogin: false,
      alertMessage: "댓글 반응 권한이 없습니다.",
    };
  }

  if (message === "NOT_FOUND") {
    return {
      shouldRedirectToLogin: false,
      alertMessage: "댓글을 찾을 수 없습니다.",
    };
  }

  if (message === "BAD_REQUEST") {
    const errors = getValidationErrors(error);
    const validationMessage = errors ? getFirstValidationErrorMessage(errors) : null;
    return {
      shouldRedirectToLogin: false,
      alertMessage: validationMessage || "댓글 반응 요청이 올바르지 않습니다.",
    };
  }

  return {
    shouldRedirectToLogin: false,
    alertMessage: "댓글 반응 처리에 실패했습니다.",
  };
}
