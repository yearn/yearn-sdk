import { Milliseconds, Seconds, Weeks } from "../types";

export const DAY: Seconds = 86400;
export const WEEK: Seconds = DAY * 7;
export const YEAR: Seconds = DAY * 365;

export function toMilliseconds(time: Seconds): Milliseconds {
  return time * 1000;
}

export function toSeconds(time: Milliseconds): Seconds {
  return Math.floor(time / 1000);
}

export function getTimeFromNow(weeks: Weeks): Seconds {
  return toSeconds(Date.now()) + weeks * WEEK;
}

export function roundToWeek(time: Seconds): Seconds {
  return Math.floor(time / WEEK) * WEEK;
}
