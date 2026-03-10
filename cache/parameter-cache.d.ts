export interface CacheEntry {
    value: string;
    timestamp: number;
    ttl: number;
}
export interface CacheStats {
    hits: number;
    misses: number;
    size: number;
    evictions: number;
}
/**
 * @description In-memory cache for SSM parameters and Secrets Manager secrets
 * with TTL-based expiration and LRU eviction policy.
 */
export declare class ParameterCache {
    private static cache;
    private static stats;
    private static readonly DEFAULT_TTL;
    private static readonly MAX_SIZE;
    /**
     * Get a value from cache if it exists and hasn't expired
     * @param key - Cache key
     * @returns Cached value or null if not found/expired
     */
    static get(key: string): string | null;
    /**
     * Set a value in cache with TTL
     * @param key - Cache key
     * @param value - Value to cache
     * @param ttl - Time-to-live in milliseconds (default: from env or 300000)
     */
    static set(key: string, value: string, ttl?: number): void;
    /**
     * Clear a specific cache entry
     * @param key - Cache key to clear
     */
    static clear(key: string): void;
    /**
     * Clear all cache entries and reset statistics
     */
    static clearAll(): void;
    /**
     * Get cache statistics
     * @returns Object with hits, misses, size, and evictions
     */
    static getStats(): CacheStats;
    /**
     * Check if caching is enabled globally
     * @returns true if caching is enabled
     */
    static isEnabled(): boolean;
    /**
     * Get default TTL from environment or use constant
     * @private
     */
    private static getDefaultTtl;
    /**
     * Get max cache size from environment or use constant
     * @private
     */
    private static getMaxSize;
    /**
     * Evict the oldest cache entry (LRU)
     * @private
     */
    private static evictOldest;
}
