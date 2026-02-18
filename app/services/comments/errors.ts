function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
}

export function redirectToGoogleLogin() {
  window.location.href = `${getApiBaseUrl()}/oauth2/authorization/google`;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "UNKNOWN";
}

export function handleFetchCommentsError(error: unknown) {
  const message = getErrorMessage(error);

  if (message === "UNAUTHORIZED") {
    redirectToGoogleLogin();
    return;
  }

  if (message === "NOT_FOUND") {
    alert("게시물을 찾을 수 없습니다.");
    return;
  }

  if (message === "BAD_REQUEST") {
    alert("댓글 목록 요청이 올바르지 않습니다.");
    return;
  }

  alert("댓글을 불러오지 못했습니다.");
}

export function handleCreateCommentError(error: unknown) {
  const message = getErrorMessage(error);

  if (message === "UNAUTHORIZED") {
    redirectToGoogleLogin();
    return;
  }

  if (message === "NOT_FOUND") {
    alert("게시물 또는 부모 댓글을 찾을 수 없습니다.");
    return;
  }

  if (message === "BAD_REQUEST") {
    alert("댓글 내용이 올바르지 않습니다.");
    return;
  }

  alert("댓글 작성에 실패했습니다.");
}
