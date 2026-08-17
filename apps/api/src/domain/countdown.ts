import type { Countdown } from "@wedding/shared";

export interface CountdownInput {
  weddingDate: string;
  timezone: string;
  now?: Date;
}

interface LocalParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

/** Wall-clock parts of an instant in the wedding's timezone. */
function localPartsInTimezone(date: Date, timezone: string): LocalParts | null {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(date);
    const get = (type: string): number => {
      const value = parts.find((p) => p.type === type)?.value ?? "0";
      const parsed = Number.parseInt(value, 10);
      return Number.isNaN(parsed) ? 0 : parsed;
    };
    return {
      year: get("year"),
      month: get("month"),
      day: get("day"),
      hour: get("hour") === 24 ? 0 : get("hour"),
      minute: get("minute"),
      second: get("second"),
    };
  } catch {
    return null;
  }
}

export function getCountdown(input: CountdownInput): Countdown {
  const target = new Date(input.weddingDate).getTime();
  if (Number.isNaN(target)) {
    return { days: 0, hours: 0, minutes: 0, passed: true, label: "Your wedding day has arrived" };
  }

  const now = input.now ?? new Date();

  // Compare wall-clock times in the wedding's timezone so day boundaries
  // (and the passed state) follow the wedding's clock, not the server's.
  const weddingLocal = localPartsInTimezone(new Date(target), input.timezone);
  const nowLocal = localPartsInTimezone(now, input.timezone);

  let diffMs: number;
  if (weddingLocal && nowLocal) {
    const weddingUtc = Date.UTC(
      weddingLocal.year,
      weddingLocal.month - 1,
      weddingLocal.day,
      weddingLocal.hour,
      weddingLocal.minute,
      weddingLocal.second,
    );
    const nowUtc = Date.UTC(
      nowLocal.year,
      nowLocal.month - 1,
      nowLocal.day,
      nowLocal.hour,
      nowLocal.minute,
      nowLocal.second,
    );
    diffMs = weddingUtc - nowUtc;
  } else {
    diffMs = target - now.getTime();
  }

  if (diffMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, passed: true, label: "Your wedding day has arrived" };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);

  return {
    days,
    hours,
    minutes,
    passed: false,
    label: `${days} day${days === 1 ? "" : "s"}`,
  };
}
