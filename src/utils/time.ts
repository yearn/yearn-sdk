import ms from "ms";

export function unix(): number {
  return Math.floor(Date.now() / 1000);
}

export function seconds(value: string): number {
  return Math.floor(ms(value) / 1000);
}
