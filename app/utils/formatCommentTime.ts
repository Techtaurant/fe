const MILLISECONDS_PER_MINUTE = 60_000;
const MILLISECONDS_PER_HOUR = 60 * MILLISECONDS_PER_MINUTE;
const MILLISECONDS_PER_DAY = 24 * MILLISECONDS_PER_HOUR;
const MILLISECONDS_PER_WEEK = 7 * MILLISECONDS_PER_DAY;
const MILLISECONDS_PER_MONTH = 30 * MILLISECONDS_PER_DAY;
const MILLISECONDS_PER_YEAR = 365 * MILLISECONDS_PER_DAY;

export function formatCommentTime(createdAt: string): string {
  const createdDate = new Date(createdAt);
  if (Number.isNaN(createdDate.getTime())) {
    return createdAt;
  }

  const now = new Date();
  const diffMs = now.getTime() - createdDate.getTime();

  if (diffMs <= 0) {
    return formatAbsoluteDate(createdDate);
  }

  if (diffMs < 60 * 1000) {
    return "방금 전";
  }

  if (diffMs < MILLISECONDS_PER_HOUR) {
    const minutes = Math.floor(diffMs / MILLISECONDS_PER_MINUTE);
    return `${minutes}분 전`;
  }

  if (diffMs < MILLISECONDS_PER_DAY) {
    const hours = Math.floor(diffMs / MILLISECONDS_PER_HOUR);
    return `${hours}시간 전`;
  }

  if (diffMs < 2 * MILLISECONDS_PER_DAY) {
    return "어제";
  }

  if (diffMs < MILLISECONDS_PER_WEEK) {
    const days = Math.floor(diffMs / MILLISECONDS_PER_DAY);
    return `${days}일 전`;
  }

  if (diffMs < 2 * MILLISECONDS_PER_WEEK) {
    return "1주일 전";
  }

  if (diffMs < MILLISECONDS_PER_MONTH) {
    const weeks = Math.floor(diffMs / MILLISECONDS_PER_WEEK);
    return `${weeks}주 전`;
  }

  if (diffMs < MILLISECONDS_PER_YEAR) {
    const months = Math.floor(diffMs / MILLISECONDS_PER_MONTH);
    return `${months}개월 전`;
  }

  return formatAbsoluteDate(createdDate, true);
}

function formatAbsoluteDate(createdDate: Date, includeYear = false): string {
  const month = `${createdDate.getMonth() + 1}`.padStart(2, "0");
  const day = `${createdDate.getDate()}`.padStart(2, "0");

  if (!includeYear && createdDate.getFullYear() === new Date().getFullYear()) {
    return `${month}-${day}`;
  }

  return `${createdDate.getFullYear()}-${month}-${day}`;
}
