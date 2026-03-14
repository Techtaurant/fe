const MILLISECONDS_PER_MINUTE = 60_000;
const MILLISECONDS_PER_HOUR = 60 * MILLISECONDS_PER_MINUTE;
const MILLISECONDS_PER_DAY = 24 * MILLISECONDS_PER_HOUR;
const MILLISECONDS_PER_WEEK = 7 * MILLISECONDS_PER_DAY;

type SupportedLocale = "ko" | "en" | "ja" | "zh";

const DEFAULT_LOCALE: SupportedLocale = "ko";

const TIME_LABELS: Record<
  SupportedLocale,
  {
    seconds: string;
    minutes: (value: number) => string;
    hours: (value: number) => string;
    yesterday: string;
    days: (value: number) => string;
  }
> = {
  ko: {
    seconds: "방금 전",
    minutes: (value) => `${value}분 전`,
    hours: (value) => `${value}시간 전`,
    yesterday: "어제",
    days: (value) => `${value}일 전`,
  },
  en: {
    seconds: "just now",
    minutes: (value) => `${value} minute${value === 1 ? "" : "s"} ago`,
    hours: (value) => `${value} hour${value === 1 ? "" : "s"} ago`,
    yesterday: "yesterday",
    days: (value) => `${value} day${value === 1 ? "" : "s"} ago`,
  },
  ja: {
    seconds: "たった今",
    minutes: (value) => `${value}分前`,
    hours: (value) => `${value}時間前`,
    yesterday: "昨日",
    days: (value) => `${value}日前`,
  },
  zh: {
    seconds: "刚刚",
    minutes: (value) => `${value}分钟前`,
    hours: (value) => `${value}小时前`,
    yesterday: "昨天",
    days: (value) => `${value}天前`,
  },
};

export function formatDisplayTime(createdAt: string, locale: string = DEFAULT_LOCALE): string {
  const createdDate = new Date(createdAt);
  if (Number.isNaN(createdDate.getTime())) {
    return createdAt;
  }

  const normalizedLocale = locale.toLowerCase().split("-")[0] as SupportedLocale;
  const labels = TIME_LABELS[normalizedLocale] ?? TIME_LABELS[DEFAULT_LOCALE];

  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - createdDate.getTime());

  if (diffMs < MILLISECONDS_PER_MINUTE) {
    return labels.seconds;
  }

  if (diffMs < MILLISECONDS_PER_HOUR) {
    const minutes = Math.floor(diffMs / MILLISECONDS_PER_MINUTE);
    return labels.minutes(minutes);
  }

  if (diffMs < MILLISECONDS_PER_DAY) {
    const hours = Math.floor(diffMs / MILLISECONDS_PER_HOUR);
    return labels.hours(hours);
  }

  if (diffMs < 2 * MILLISECONDS_PER_DAY) {
    return labels.yesterday;
  }

  if (diffMs < MILLISECONDS_PER_WEEK) {
    const days = Math.floor(diffMs / MILLISECONDS_PER_DAY);
    return labels.days(days);
  }

  return formatAbsoluteDate(createdDate, normalizedLocale);
}

function formatAbsoluteDate(createdDate: Date, locale: string): string {
  const month = `${createdDate.getMonth() + 1}`.padStart(2, "0");
  const day = `${createdDate.getDate()}`.padStart(2, "0");

  const year = `${createdDate.getFullYear()}`;
  return locale.startsWith("en")
    ? `${month}-${day}-${year}`
    : `${year}-${month}-${day}`;
}
