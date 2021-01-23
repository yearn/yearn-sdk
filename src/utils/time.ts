import ms from "ms";

export function unix(offset?: string): number {
  if (offset) {
    return Math.floor((Date.now() + ms(offset)) / 1000);
  }
  return Math.floor(Date.now() / 1000);
}
