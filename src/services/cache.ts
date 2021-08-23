import { Service } from "../common";

export class CacheService extends Service {
  async call(path: string): Promise<unknown> {
    if (!this.ctx.cache.useCache) {
      return undefined;
    }
    const cachedCall = await fetch(this.ctx.cache.url + path);
    if (cachedCall.status !== 200) {
      return undefined;
    }
    return await cachedCall.json();
  }
}
