import hash from "object-hash";

const CACHE_NAMESPACE = "yearn_sdk";

export interface Cache {
  set: (key: string, value: string) => void;
  get: (key: string) => string | undefined;
  ttl?: number;
}

export interface Cached {
  value: any;
  timestamp: number;
}

export class CacheManager {
  private cache: Required<Cache>;

  constructor(cache?: Cache) {
    this.cache = Object.assign(
      {},
      {
        get: () => undefined,
        set: () => {},
        ttl: Infinity
      },
      cache
    );
  }

  private what(key: string, ...args: any[]): string {
    return (
      CACHE_NAMESPACE +
      hash({
        key,
        args
      })
    );
  }

  set(value: any, key: string, ...args: any[]) {
    const id = this.what(key, ...args);
    this.cache.set(
      id,
      JSON.stringify({
        value,
        timestamp: Date.now()
      })
    );
  }

  get(key: string, ...args: any[]): any | undefined {
    const id = this.what(key, ...args);
    const raw = this.cache.get(id);
    if (!raw) return undefined;
    const cached = JSON.parse(raw) as Cached;
    if (Date.now() - cached.timestamp > this.cache.ttl) return undefined;
    return cached.value;
  }
}
