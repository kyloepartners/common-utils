"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheConfigManager = void 0;
const logger_1 = require("../logger");
const index_1 = require("../index");
/**
 * @description Centralized configuration manager for cache behavior
 */
class CacheConfigManager {
    /**
     * Get current cache configuration
     */
    static getConfig() {
        if (!CacheConfigManager.config) {
            CacheConfigManager.config = CacheConfigManager.loadFromEnvironment();
        }
        return Object.assign({}, CacheConfigManager.config);
    }
    /**
     * Update cache configuration at runtime
     */
    static updateConfig(partial) {
        logger_1.Logger.internal.verbose('CacheConfigManager.updateConfig');
        const current = CacheConfigManager.getConfig();
        CacheConfigManager.config = Object.assign(Object.assign({}, current), partial);
        logger_1.Logger.internal.log('Cache configuration updated');
        logger_1.Logger.internal.debug(CacheConfigManager.config);
    }
    /**
     * Reset to default configuration
     */
    static reset() {
        logger_1.Logger.internal.verbose('CacheConfigManager.reset');
        CacheConfigManager.config = CacheConfigManager.loadFromEnvironment();
        logger_1.Logger.internal.log('Cache configuration reset to defaults');
    }
    /**
     * Load configuration from environment variables
     * @private
     */
    static loadFromEnvironment() {
        const enabled = (0, index_1.getEnvironmentVariable)('CACHE_ENABLED');
        const ttl = (0, index_1.getEnvironmentVariable)('CACHE_TTL_MS');
        const maxSize = (0, index_1.getEnvironmentVariable)('CACHE_MAX_SIZE');
        const clearOnError = (0, index_1.getEnvironmentVariable)('CACHE_CLEAR_ON_ERROR');
        const logStats = (0, index_1.getEnvironmentVariable)('CACHE_LOG_STATS');
        return {
            enabled: enabled === undefined ? true : (enabled === 'true' || enabled === '1' || enabled === true),
            defaultTtl: CacheConfigManager.parseNumber(ttl, 300000),
            maxSize: CacheConfigManager.parseNumber(maxSize, 256),
            clearOnError: clearOnError === 'true' || clearOnError === '1' || clearOnError === true,
            logStats: logStats === 'true' || logStats === '1' || logStats === true,
        };
    }
    /**
     * Parse environment variable to number with fallback
     * @private
     */
    static parseNumber(value, defaultValue) {
        if (value === undefined) {
            return defaultValue;
        }
        if (typeof value === 'number') {
            return value;
        }
        const parsed = parseInt(String(value), 10);
        return isNaN(parsed) ? defaultValue : parsed;
    }
}
exports.CacheConfigManager = CacheConfigManager;
CacheConfigManager.config = null;
