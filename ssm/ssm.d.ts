export interface GetParameterOptions {
    /**
     * @description Tries to decrypt the response as a Base64 string, if it fails it will default to the raw value. If both parseBase64 and parseJson is true. This parameter will be parsed first.
     */
    parseBase64?: boolean;
    /**
     * @description Tries to parse the response as a JSON, if it fails it will default to the raw value. If both parseBase64 and parseJson is true. This parameter will be parsed only after parseBase64 is done.
     */
    parseJson?: boolean;
    /**
     * @description The stage to use when adding the parameter.
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
export interface AddParameterOptions {
    /**
     * @description If the parameter already exists then it will overwrite it.
     * @default false
     */
    overwrite?: boolean;
    /**
     * @description Converts the stringified value to base64 before storing it.
     * @default false
     */
    convertToBase64?: boolean;
    /**
     * @description The stage to use when adding the parameter.
     */
    stage?: string;
    /**
     * @description Enable/disable cache invalidation for this call
     * @default true
     */
    cache?: boolean;
}
export interface GetParametersByPathOptions {
    /**
     * @default false
     */
    recursive?: boolean;
    /**
     * @description The stage to use when adding the parameter.
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
export interface DeleteParameterOptions {
    /**
     * @description The stage to use when adding the parameter.
     */
    stage?: string;
    /**
     * @description Enable/disable cache invalidation for this call
     * @default true
     */
    cache?: boolean;
}
/**
 * @description A helper class to retrieve an SSM parameter based on stages. It ensures that the standard format for the parameter is correct.
 */
export declare class SSM {
    /**
     *
     * @description Retrieves the SSM parameter from AWS and ensures the key follows the format `/app/stage/parameter`. In case there is an extra parameter you should pass it via the `parameter` property. ei. `parameter1/parameter2` resulting in `/app/stage/parameter1/parameter2`
     *
     * @param app The app that you are retrieving the SSM parameter for.
     * @param parameter The parameter that you are retrieving.
     * @param options Optional parameters to manipulate the output response.
     */
    static getParameter(app: string, parameter: string, options?: GetParameterOptions): Promise<string>;
    static addParameter(app: string, parameter: string, value: {
        [key: string]: any;
    } | string | number, key: string, options?: AddParameterOptions): Promise<void>;
    static getParametersByPath(app: string, parameter: string, options?: GetParametersByPathOptions): Promise<any>;
    static deleteParameter(app: string, parameter: string, options?: DeleteParameterOptions): Promise<void>;
    /**
     * Process parameter value with parsing options
     * @private
     */
    private static processValue;
    private static buildParameter;
}
