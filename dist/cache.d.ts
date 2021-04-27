export interface Cache {
    set: (key: string, value: string) => void;
    get: (key: string) => string | undefined;
    ttl?: number;
}
export interface Cached {
    value: any;
    timestamp: number;
}
export declare class CacheManager {
    private cache;
    constructor(cache?: Cache);
    private what;
    set(value: any, key: string, ...args: any[]): void;
    get(key: string, ...args: any[]): any | undefined;
}
