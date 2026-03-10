"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParameterCache = void 0;
const logger_1 = require("../logger");
const index_1 = require("../index");
/**
 * @description In-memory cache for SSM parameters and Secrets Manager secrets
 * with TTL-based expiration and LRU eviction policy.
 */
class ParameterCache {
    /**
     * Get a value from cache if it exists and hasn't expired
     * @param key - Cache key
     * @returns Cached value or null if not found/expired
     */
    static get(key) {
        logger_1.Logger.internal.verbose(`ParameterCache.get: ${key}`);
        if (!ParameterCache.isEnabled()) {
            logger_1.Logger.internal.verbose('Cache is disabled globally');
            return null;
        }
        const entry = ParameterCache.cache.get(key);
        if (!entry) {
            logger_1.Logger.internal.verbose('Cache miss: entry not found');
            ParameterCache.stats.misses++;
            return null;
        }
        const now = Date.now();
        const isExpired = now > entry.timestamp + entry.ttl;
        if (isExpired) {
            logger_1.Logger.internal.verbose('Cache miss: entry expired');
            ParameterCache.cache.delete(key);
            ParameterCache.stats.misses++;
            ParameterCache.stats.size = ParameterCache.cache.size;
            return null;
        }
        logger_1.Logger.internal.verbose('Cache hit');
        ParameterCache.stats.hits++;
        return entry.value;
    }
    /**
     * Set a value in cache with TTL
     * @param key - Cache key
     * @param value - Value to cache
     * @param ttl - Time-to-live in milliseconds (default: from env or 300000)
     */
    static set(key, value, ttl) {
        logger_1.Logger.internal.verbose(`ParameterCache.set: ${key}`);
        if (!ParameterCache.isEnabled()) {
            logger_1.Logger.internal.verbose('Cache is disabled globally, skipping set');
            return;
        }
        // Use provided TTL, or environment variable, or default
        const cacheTtl = ttl !== null && ttl !== void 0 ? ttl : ParameterCache.getDefaultTtl();
        // Check if we need to evict entries (LRU)
        if (ParameterCache.cache.size >= ParameterCache.getMaxSize() && !ParameterCache.cache.has(key)) {
            ParameterCache.evictOldest();
        }
        const entry = {
            value,
            timestamp: Date.now(),
            ttl: cacheTtl,
        };
        ParameterCache.cache.set(key, entry);
        ParameterCache.stats.size = ParameterCache.cache.size;
        logger_1.Logger.internal.verbose(`Cache entry set with TTL: ${cacheTtl}ms`);
    }
    /**
     * Clear a specific cache entry
     * @param key - Cache key to clear
     */
    static clear(key) {
        logger_1.Logger.internal.verbose(`ParameterCache.clear: ${key}`);
        const deleted = ParameterCache.cache.delete(key);
        if (deleted) {
            ParameterCache.stats.size = ParameterCache.cache.size;
            logger_1.Logger.internal.log(`Cache entry cleared: ${key}`);
        }
    }
    /**
     * Clear all cache entries and reset statistics
     */
    static clearAll() {
        logger_1.Logger.internal.verbose('ParameterCache.clearAll');
        const previousSize = ParameterCache.cache.size;
        ParameterCache.cache.clear();
        ParameterCache.stats = { hits: 0, misses: 0, size: 0, evictions: 0 };
        logger_1.Logger.internal.log(`Cleared ${previousSize} cache entries and reset statistics`);
    }
    /**
     * Get cache statistics
     * @returns Object with hits, misses, size, and evictions
     */
    static getStats() {
        return Object.assign({}, ParameterCache.stats);
    }
    /**
     * Check if caching is enabled globally
     * @returns true if caching is enabled
     */
    static isEnabled() {
        const enabled = (0, index_1.getEnvironmentVariable)('CACHE_ENABLED');
        if (enabled === undefined) {
            return true; // Default to enabled
        }
        return enabled === 'true' || enabled === '1' || enabled === true;
    }
    /**
     * Get default TTL from environment or use constant
     * @private
     */
    static getDefaultTtl() {
        const envTtl = (0, index_1.getEnvironmentVariable)('CACHE_TTL_MS');
        if (envTtl !== undefined) {
            const parsed = typeof envTtl === 'number' ? envTtl : parseInt(String(envTtl), 10);
            if (!isNaN(parsed) && parsed > 0) {
                return parsed;
            }
        }
        return ParameterCache.DEFAULT_TTL;
    }
    /**
     * Get max cache size from environment or use constant
     * @private
     */
    static getMaxSize() {
        const envMaxSize = (0, index_1.getEnvironmentVariable)('CACHE_MAX_SIZE');
        if (envMaxSize !== undefined) {
            const parsed = typeof envMaxSize === 'number' ? envMaxSize : parseInt(String(envMaxSize), 10);
            if (!isNaN(parsed) && parsed > 0) {
                return parsed;
            }
        }
        return ParameterCache.MAX_SIZE;
    }
    /**
     * Evict the oldest cache entry (LRU)
     * @private
     */
    static evictOldest() {
        logger_1.Logger.internal.verbose('ParameterCache.evictOldest: Cache size limit reached');
        let oldestKey = null;
        let oldestTimestamp = Infinity;
        // Find entry with oldest timestamp
        for (const [key, entry] of ParameterCache.cache.entries()) {
            if (entry.timestamp < oldestTimestamp) {
                oldestTimestamp = entry.timestamp;
                oldestKey = key;
            }
        }
        if (oldestKey) {
            ParameterCache.cache.delete(oldestKey);
            ParameterCache.stats.evictions++;
            ParameterCache.stats.size = ParameterCache.cache.size;
            logger_1.Logger.internal.log(`Cache entry evicted (LRU): ${oldestKey}`);
        }
    }
}
exports.ParameterCache = ParameterCache;
ParameterCache.cache = new Map();
ParameterCache.stats = { hits: 0, misses: 0, size: 0, evictions: 0 };
ParameterCache.DEFAULT_TTL = 300000; // 5 minutes
ParameterCache.MAX_SIZE = 256;
