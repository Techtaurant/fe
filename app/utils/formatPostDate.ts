export function formatPostDate(timestamp: string, locale = "en"): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return timestamp.slice(0, 10);
  }

  const normalizedLocale = locale.toLowerCase();
  const year = `${date.getFullYear()}`;
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  if (normalizedLocale.startsWith("ko")) {
    return `${year}년 ${month}월 ${day}일`;
  }

  if (normalizedLocale.startsWith("ja")) {
    return `${year}年${month}月${day}日`;
  }

  if (normalizedLocale.startsWith("zh")) {
    return `${year}年${month}月${day}日`;
  }

  return `${year}-${month}-${day}`;
}
