import { Service } from "../common";

export class CacheService extends Service {
  async call(path: string): Promise<unknown> {
    if (!this.ctx.cache.useCache || !this.ctx.cache.url) {
      return undefined;
    }
    const cachedCall = await fetch(`${this.ctx.cache.url}/v1/chains/${this.chainId}/${path}`);
    if (cachedCall.status !== 200) {
      const { url, status, statusText } = cachedCall;
      console.warn(`Call to cache failed at ${url} (status ${status} ${statusText})`);
      return undefined;
    }
    return await cachedCall.json();
  }
}
