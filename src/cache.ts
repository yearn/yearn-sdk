import { ChainId } from "./chain";
import { Context } from "./context";

export class CachedFetcher<T> {
  expiryDate?: Date;
  cachedValue?: T;
  path: string;
  ctx: Context;
  chainId: ChainId;

  constructor(path: string, ctx: Context, chainId: ChainId) {
    this.path = path;
    this.ctx = ctx;
    this.chainId = chainId;
  }

  async fetch(queryParameters?: string): Promise<T | undefined> {
    if (!this.ctx.cache.useCache || !this.ctx.cache.url) {
      return undefined;
    }

    const cached = this.currentValue;
    if (cached) {
      return cached;
    }

    let path = `${this.ctx.cache.url}/v1/chains/${this.chainId}/${this.path}`;
    if (queryParameters) {
      path += `?${queryParameters}`;
    }

    let call: Response;
    try {
      const timeout = 5000;
      call = await this.fetchWithTimeout(path, timeout);
    } catch {
      console.warn(`Call to cache at ${path} timed out`);
      return undefined;
    }

    if (call.status !== 200) {
      const { url, status, statusText } = call;
      console.warn(`Call to cache failed at ${url} (status ${status} ${statusText})`);
      return undefined;
    }

    const json = await call.json();
    if (!json) {
      return undefined;
    }

    const maxAgeMatches = call.headers.get("cache-control")?.match(/max-age=(\d+)/);
    const maxAge = maxAgeMatches ? parseInt(maxAgeMatches[1], 10) : 30;
    const now = new Date().getTime();
    this.expiryDate = new Date(now + maxAge * 1000);
    this.cachedValue = json;

    return json as T;
  }

  async fetchWithTimeout(url: string, timeout: number): Promise<Response> {
    return Promise.race([
      fetch(url),
      new Promise<Response>((_, reject) => setTimeout(() => reject("timeout"), timeout))
    ]);
  }

  get currentValue(): T | undefined {
    if (!this.expiryDate) {
      return undefined;
    }

    const now = new Date();
    if (now < this.expiryDate && this.cachedValue) {
      return this.cachedValue;
    }

    return undefined;
  }
}
