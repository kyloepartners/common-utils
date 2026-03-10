export interface CacheConfig {
    enabled: boolean;
    defaultTtl: number;
    maxSize: number;
    clearOnError: boolean;
    logStats: boolean;
}
/**
 * @description Centralized configuration manager for cache behavior
 */
export declare class CacheConfigManager {
    private static config;
    /**
     * Get current cache configuration
     */
    static getConfig(): CacheConfig;
    /**
     * Update cache configuration at runtime
     */
    static updateConfig(partial: Partial<CacheConfig>): void;
    /**
     * Reset to default configuration
     */
    static reset(): void;
    /**
     * Load configuration from environment variables
     * @private
     */
    private static loadFromEnvironment;
    /**
     * Parse environment variable to number with fallback
     * @private
     */
    private static parseNumber;
}
