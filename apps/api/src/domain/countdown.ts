import type { Countdown } from "@wedding/shared";

export interface CountdownInput {
  weddingDate: string;
  timezone: string;
  now?: Date;
}

export function getCountdown(input: CountdownInput): Countdown {
  const target = new Date(input.weddingDate).getTime();
  const now = input.now ?? new Date();

  const diffMs = target - now.getTime();

  if (Number.isNaN(target) || diffMs <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      passed: true,
      label: "Your wedding day has arrived",
    };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  return {
    days,
    hours,
    minutes,
    seconds,
    passed: false,
    label: `${days} day${days === 1 ? "" : "s"}`,
  };
}
