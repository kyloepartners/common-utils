export interface GetSecretOptions {
    /**
     * @description Tries to decrypt the response as a Base64 string, if it fails it will default to the raw value. If both parseBase64 and parseJson is true. This parameter will be parsed first.
     */
    parseBase64?: boolean;
    /**
     * @description Tries to parse the response as a JSON, if it fails it will default to the raw value. If both parseBase64 and parseJson is true. This parameter will be parsed only after parseBase64 is done.
     */
    parseJson?: boolean;
    /**
     * @description Overrides the stage of the secret. Defaults to `process.env.STAGE`.
     */
    stage?: string;
    /**
     * @description Enable/disable caching for this call
     * @default true
     */
    cache?: boolean;
    /**
     * @description Custom TTL in milliseconds for this call
     */
    cacheTtl?: number;
}
export interface CreateSecretOptions {
    /**
     * @description If the secret already exists then it will overwrite it.
     * @default false
     */
    overwrite?: boolean;
    /**
     * @description Converts the stringified value to base64 before storing it.
     * @default false
     */
    convertToBase64?: boolean;
    /**
     * @description Overrides the stage of the secret. Defaults to `process.env.STAGE`.
     */
    stage?: string;
    /**
     * @description Enable/disable cache invalidation for this call
     * @default true
     */
    cache?: boolean;
}
export interface ListSecretsOptions {
    /**
     * @description Overrides the stage of the secret. Defaults to `process.env.STAGE`.
     */
    stage?: string;
    /**
     * @description Enable/disable caching for this call
     * @default true
     */
    cache?: boolean;
    /**
     * @description Custom TTL in milliseconds for this call
     */
    cacheTtl?: number;
}
export interface DeleteSecretOptions {
    /**
     * @description Overrides the stage of the secret. Defaults to `process.env.STAGE`.
     */
    stage?: string;
    /**
     * @description Enable/disable cache invalidation for this call
     * @default true
     */
    cache?: boolean;
}
/**
 * @description A helper class to retrieve a secret from AWS Secrets Manager based on stages. It ensures that the standard format for the secret is correct.
 */
export declare class SecretsManager {
    /**
     *
     * @description Retrieves the secret from AWS Secrets Manager and ensures the key follows the format `/app/stage/secretName`. In case there is an extra parameter you should pass it via the `secretName` property. ei. `secretName1/secretName2` resulting in `/app/stage/secretName1/secretName2`
     *
     * @param app The app that you are retrieving the secret for.
     * @param secretName The name of the secret that you are retrieving.
     * @param options Optional parameters to manipulate the output response.
     */
    static getSecret<T = string>(app: string, secretName: string, options?: GetSecretOptions): Promise<T>;
    static createSecret(app: string, secretName: string, value: {
        [key: string]: any;
    } | string | number, key: string, options?: CreateSecretOptions): Promise<void>;
    static listSecrets(app: string, secretName: string, options?: ListSecretsOptions): Promise<{
        [key: string]: any;
    }>;
    static deleteSecret(app: string, secretName: string, options?: DeleteSecretOptions): Promise<void>;
    /**
     * Process secret value with parsing options
     * @private
     */
    private static processValue;
    private static buildSecretName;
}
