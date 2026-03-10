import { Identity } from '../api';
import { LambdaEvent } from '../index';
import { Context } from 'aws-lambda';
export type FederatedIdentityId = string;
/**
 * @example
 */
export type CognitoUserId = string;
/**
 * @description This is either a user federated identity id or a Cognito User Identity ID
 */
export type UserId = FederatedIdentityId | CognitoUserId;
/**
 * @description Optional parameters that can be used to modify the default values.
 */
export interface ProcessOptions {
    /**
     * @description Pass this value if you wish to change modify the database that the method will call. If not passed it will default to use the environment variables `APP` and `SSM_PARAMETER` or `READ_ONLY_SSM_PARAMETER` if its called from `Database.processReadOnly`
     */
    ssm?: {
        app: string;
        parameter: string;
    };
    /**
     * @description Pass this value if you wish to change modify the database that the method will call. If not passed it will default to use the environment variables `APP` and `SECRETS_MANAGER_PARAMETER` or `READ_ONLY_SECRETS_MANAGER_PARAMETER` if its called from `Database.processReadOnly`
     */
    secretsmanager?: {
        app: string;
        parameter: string;
    };
    /**
     * @description Pass this value if you wish to modify the database that the method will call. If not passed it will default to use the environment variables `APP` and `SSM_PARAMETER` or `READ_ONLY_SSM_PARAMETER` if its called from `Database.processReadOnly`
     */
    rawConnectionString?: string;
    connectionConfig?: {
        protocol?: string;
        host: string;
        port?: number;
        user: string;
        password: string;
        database?: string;
    };
    /**
     * @description Pass this value if you wish to modify the UserId that will be calling the database with. This option is required if the call isn't coming via an API authenticate with a Cognito User Pool.
     */
    userId?: UserId;
    /**
     * @description Pass this value if you wish to skip the user id being passed to the stored procedure.
     * This is useful when the stored procedure doesn't require a user id.
     * This is ignored when using `Database.any`
     */
    skipUserId?: boolean;
    /**
     * @description Pass this value if an Identity object exists
     * This is a simple method that passes the value from Identity.cognitoIdentityId to be used as userId
     * This is ignored when using `Database.any`
     *
     * @example
     * // instead of
     * Database.process(event, 'my_stored_procedure', ['my_param'], { userId: 'my_user_id' });
     * // you can do
     * Database.process(event, 'my_stored_procedure', ['my_param'], { identity: Identity.fromEvent(event) });
     * // is the same as
     * Database.process(event, 'my_stored_procedure', ['my_param'], { userId: Identity.fromEvent(event).cognitoIdentityId });
     */
    identity?: Identity;
    /**
     * @description Enable/disable caching for connection string retrieval
     * @default true
     */
    cache?: boolean;
    /**
     * @description Custom TTL for cached connection string
     */
    cacheTtl?: number;
}
export interface ProcessPayload {
    /**
     * @deprecated Deprecated in favour of `options.userId`
     */
    federatedIdentityId?: string;
    wu?: boolean;
    [key: string]: any;
}
/**
 * @description This class handles all database connections and calls the database, it automatically retrieves all the necessary connection string based on the Environment Variables or the options passed.
 */
export declare class Database {
    private static connections;
    /**
     * @description Calls the read/write database.
     *
     * ```javascript
     * const {Database} = require('common-utils/database');
     *
     * Database.process(
     *   event,
     *   functionName,
     *   fieldsToPass,
     *   options, // Optional
     * ).then(data => {...Bunch of code...})
     *  .catch(err => {...Bunch of code...})
     * ```
     *
     * @param payload The object that the data will be extracted from.
     * @param functionName The name of the database stored procedure to call.
     * @param fieldsToPass The fields from the event that should be passed to the stored procedure. This order of the item in the list must match the order of the stored procedure parameters. Please note that the user id is always passed as the first argument and therefore must not be included on this list.
     * @param options Optional parameters that can be used to modify the default values.
     */
    static process<TOutput = any>(payload: ProcessPayload, functionName: string, fieldsToPass: string[], options?: ProcessOptions): Promise<TOutput>;
    /**
     * @description Calls the read only database.
     *
     * ```javascript
     * const {Database} = require('common-utils/database');
     *
     * Database.processReadOnly(
     *   event,
     *   functionName,
     *   fieldsToPass,
     *   options, // Optional
     * ).then(data => {...Bunch of code...})
     *  .catch(err => {...Bunch of code...})
     * ```
     *
     * @param payload The object that the data will be extracted from.
     * @param functionName The name of the database stored procedure to call.
     * @param fieldsToPass The fields from the event that should be passed to the stored procedure. This order of the item in the list must match the order of the stored procedure parameters. Please note that the user id is always passed as the first argument and therefore must not be included on this list.
     * @param options Optional parameters that can be used to modify the default values.
     */
    static processReadOnly<TOutput = any>(payload: ProcessPayload, functionName: string, fieldsToPass: string[], options?: ProcessOptions): Promise<TOutput>;
    /**
     * @description
     * Executes a query that can return any number of rows.
     *
     * - When no rows are returned, it resolves with an empty array.
     * - When 1 or more rows are returned, it resolves with the array of rows.
     */
    static any(query: string, data: unknown[] | {
        [key: string]: unknown;
    }, options?: ProcessOptions): Promise<any[]>;
    /**
     * @description Retrieves the connection string from the SSM and tries to open a connection if there isn't one open for the specified connection string.
     * @private
     */
    private static connect;
    private static getConnectionString;
    private static parseConnectionString;
    /**
     * @description Determines if a connection is already open for the specified connection string, otherwise it opens one.
     * @private
     */
    private static getConnectionIfOpenOtherwiseCreateOne;
    /**
     * @description Maps the payload based on the fieldsToPass values, and calls the database stored procedure with the name passed on functionName.
     *
     * @param db The Database object used to call the function on.
     * @param payload The object that the data will be extracted from.
     * @param functionName The name of the database stored procedure to call.
     * @param fieldsToPass The fields from the event that should be passed to the stored procedure. This order of the item in the list must match the order of the stored procedure parameters. Please note that the user id is always passed as the first argument and therefore must not be included on this list.
     * @param options Optional parameters that can be used to modify the default values.
     * @private
     */
    private static storedProcedure;
    /**
     * @description Gets the user id from the payload and options. The user id is determined using the following order.
     *
     * 1. options.userId
     * 2. payload.requestContext.identity.cognitoAuthenticationProvider
     * 3. payload.federatedIdentityId - should be avoided as its currently deprecated in favour of options.userId.
     *
     * It unable to get a User ID it will throw an error.
     *
     * @param payload The object that the data will be extracted from. This is used to determine the Cognito User Identity ID.
     * @param options Options to override the userId.
     * @private
     */
    static getUserId(payload: LambdaEvent | Context, options?: ProcessOptions): UserId;
    private static isWarmUp;
    /**
     * Check if error is a PostgreSQL connection error
     * @private
     */
    private static isConnectionError;
    /**
     * Build cache key for connection string
     * @private
     */
    private static buildConnectionCacheKey;
}
