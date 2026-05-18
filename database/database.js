"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Database = void 0;
const ssm_1 = require("../ssm");
const logger_1 = require("../logger");
const pg_promise_1 = __importDefault(require("pg-promise"));
const api_1 = require("../api");
const index_1 = require("../index");
const secrets_manager_1 = require("../secrets-manager");
const connection_string_1 = require("connection-string");
const pg_connection_string_1 = __importDefault(require("pg-connection-string"));
const cache_1 = require("../cache");
const pgp = (0, pg_promise_1.default)();
/**
 * @description This class handles all database connections and calls the database, it automatically retrieves all the necessary connection string based on the Environment Variables or the options passed.
 */
class Database {
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
    static process(payload, functionName, fieldsToPass, options) {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.Logger.internal.verbose('Database.process');
            if (Database.isWarmUp(payload)) {
                logger_1.Logger.internal.log('Function called from Warm Up trigger!');
                throw new Error('Function called from Warm Up trigger!');
            }
            try {
                logger_1.Logger.internal.verbose('Connecting to database!');
                const database = yield Database.connect(Object.assign(Object.assign({}, options), { isReadOnly: false }));
                logger_1.Logger.internal.verbose('Calling stored procedure!');
                return yield Database.storedProcedure(database, payload, functionName, fieldsToPass, options);
            }
            catch (error) {
                if (Database.isConnectionError(error)) {
                    logger_1.Logger.internal.warning('Database connection failed, invalidating cache and retrying');
                    // Clear the cached connection string
                    const cacheKey = Database.buildConnectionCacheKey(Object.assign(Object.assign({}, options), { isReadOnly: false }));
                    if (cacheKey) {
                        cache_1.ParameterCache.clear(cacheKey);
                    }
                    // Retry with cache disabled
                    logger_1.Logger.internal.verbose('Retrying connection with fresh connection string');
                    const database = yield Database.connect(Object.assign(Object.assign({}, options), { isReadOnly: false, cache: false }));
                    return yield Database.storedProcedure(database, payload, functionName, fieldsToPass, options);
                }
                throw error;
            }
        });
    }
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
    static processReadOnly(payload, functionName, fieldsToPass, options) {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.Logger.internal.verbose('Database.processReadOnly');
            if (Database.isWarmUp(payload)) {
                logger_1.Logger.internal.log('Function called from Warm Up trigger!');
                throw new Error('Function called from Warm Up trigger!');
            }
            try {
                logger_1.Logger.internal.verbose('Connecting to database!');
                const database = yield Database.connect(Object.assign(Object.assign({}, options), { isReadOnly: true }));
                logger_1.Logger.internal.verbose('Calling stored procedure!');
                return yield Database.storedProcedure(database, payload, functionName, fieldsToPass, options);
            }
            catch (error) {
                if (Database.isConnectionError(error)) {
                    logger_1.Logger.internal.warning('Database connection failed, invalidating cache and retrying');
                    // Clear the cached connection string
                    const cacheKey = Database.buildConnectionCacheKey(Object.assign(Object.assign({}, options), { isReadOnly: true }));
                    if (cacheKey) {
                        cache_1.ParameterCache.clear(cacheKey);
                    }
                    // Retry with cache disabled
                    logger_1.Logger.internal.verbose('Retrying connection with fresh connection string');
                    const database = yield Database.connect(Object.assign(Object.assign({}, options), { isReadOnly: true, cache: false }));
                    return yield Database.storedProcedure(database, payload, functionName, fieldsToPass, options);
                }
                throw error;
            }
        });
    }
    /**
     * @description
     * Executes a query that can return any number of rows.
     *
     * - When no rows are returned, it resolves with an empty array.
     * - When 1 or more rows are returned, it resolves with the array of rows.
     */
    static any(query_1, data_1) {
        return __awaiter(this, arguments, void 0, function* (query, data, options = {}) {
            logger_1.Logger.internal.verbose('Database.any');
            const database = yield Database.connect(Object.assign(Object.assign({}, options), { isReadOnly: false }));
            logger_1.Logger.internal.verbose('Calling any');
            return database.any(query, data);
        });
    }
    /**
     * @description Retrieves the connection string from the SSM and tries to open a connection if there isn't one open for the specified connection string.
     * @private
     */
    static connect(options) {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.Logger.internal.verbose('Database.connect');
            logger_1.Logger.internal.verbose('Getting connection string!');
            const connectionString = yield Database.getConnectionString(options);
            logger_1.Logger.internal.sensitive('DB Connection String', connectionString);
            logger_1.Logger.internal.verbose('Get connection if open otherwise create one!');
            return Database.getConnectionIfOpenOtherwiseCreateOne(connectionString.toString());
        });
    }
    static getConnectionString(options) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h;
            logger_1.Logger.internal.verbose('Database.getConnectionString');
            const app = (_d = (_b = (_a = options.ssm) === null || _a === void 0 ? void 0 : _a.app) !== null && _b !== void 0 ? _b : (_c = options.secretsmanager) === null || _c === void 0 ? void 0 : _c.app) !== null && _d !== void 0 ? _d : (0, index_1.getEnvironmentVariable)('APP');
            logger_1.Logger.internal.verbose('Check if raw connection string is valid!');
            if (options.connectionConfig) {
                const { protocol, host, port, user, password, database } = options.connectionConfig;
                return new connection_string_1.ConnectionString(`${host}:${port !== null && port !== void 0 ? port : '5432'}`, {
                    user,
                    password,
                    path: [database !== null && database !== void 0 ? database : 'postgres'],
                    protocol: protocol !== null && protocol !== void 0 ? protocol : 'postgres',
                });
            }
            if (options.rawConnectionString) {
                return Database.parseConnectionString(options.rawConnectionString);
            }
            const defaultSsmParameter = (0, index_1.getEnvironmentVariable)('SSM_PARAMETER');
            const defaultRoSsmParameter = (0, index_1.getEnvironmentVariable)('READ_ONLY_SSM_PARAMETER');
            const ssmParameter = (_f = (_e = options.ssm) === null || _e === void 0 ? void 0 : _e.parameter) !== null && _f !== void 0 ? _f : (options.isReadOnly ? defaultRoSsmParameter : defaultSsmParameter);
            logger_1.Logger.internal.verbose('Check if ssm parameters are valid!');
            if (app && ssmParameter) {
                const connectionString = yield ssm_1.SSM.getParameter(app, ssmParameter, {
                    cache: options.cache,
                    cacheTtl: options.cacheTtl,
                });
                return Database.parseConnectionString(connectionString);
            }
            const defaultSecretsManagerParameter = (0, index_1.getEnvironmentVariable)('SECRETS_MANAGER_PARAMETER');
            const defaultRoSecretsManagerParameter = (0, index_1.getEnvironmentVariable)('READ_ONLY_SECRETS_MANAGER_PARAMETER');
            const secretsManagerParameter = (_h = (_g = options.secretsmanager) === null || _g === void 0 ? void 0 : _g.parameter) !== null && _h !== void 0 ? _h : (options.isReadOnly ? defaultRoSecretsManagerParameter : defaultSecretsManagerParameter);
            logger_1.Logger.internal.verbose('Check if secrets manager parameters are valid!');
            if (app && secretsManagerParameter) {
                const connectionString = yield secrets_manager_1.SecretsManager.getSecret(app, secretsManagerParameter, {
                    cache: options.cache,
                    cacheTtl: options.cacheTtl,
                });
                return Database.parseConnectionString(connectionString);
            }
            logger_1.Logger.internal.debug(`Received APP environment variable as ${app}`);
            logger_1.Logger.internal.debug(`Received ${options.isReadOnly ? 'READ_ONLY_SSM_PARAMETER' : 'SSM_PARAMETER'} environment variable as ${ssmParameter}`);
            logger_1.Logger.internal.debug(`Received ${options.isReadOnly ? 'READ_ONLY_SECRETS_MANAGER_PARAMETER' : 'SECRETS_MANAGER_PARAMETER'} environment variable as ${secretsManagerParameter}`);
            const message = 'SSM configuration not found! Please ensure to provide both "APP" and a "SSM_PARAMETER" or "SECRETS_MANAGER_PARAMETER" as an environment variable or to have passed the configuration to options.ssm or options.secretsmanager';
            logger_1.Logger.internal.error(500, message);
            throw new Error(message);
        });
    }
    static parseConnectionString(connectionString) {
        const { host, port, user, password, database } = pg_connection_string_1.default.parse(connectionString);
        return new connection_string_1.ConnectionString(`${host}:${port !== null && port !== void 0 ? port : '5432'}`, {
            user,
            password,
            path: [database !== null && database !== void 0 ? database : 'postgres'],
            protocol: 'postgres',
        });
    }
    /**
     * @description Determines if a connection is already open for the specified connection string, otherwise it opens one.
     * @private
     */
    static getConnectionIfOpenOtherwiseCreateOne(connectionString) {
        logger_1.Logger.internal.verbose('Database.getConnectionIfOpenOtherwiseCreateOne');
        let db;
        if (Database.connections[connectionString]) {
            logger_1.Logger.internal.verbose('Connection is open, reusing it!');
            db = Database.connections[connectionString];
        }
        else {
            logger_1.Logger.internal.verbose('Creating a new connection to use!');
            Database.connections[connectionString] = pgp({ connectionString });
            db = Database.connections[connectionString];
            logger_1.Logger.internal.verbose('New connection created, using it!');
        }
        return db;
    }
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
    static storedProcedure(db, payload, functionName, fieldsToPass, options) {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.Logger.internal.verbose('Database.storedProcedure');
            logger_1.Logger.internal.verbose('Building array of values to pass to function!');
            const params = [];
            if (!(options === null || options === void 0 ? void 0 : options.skipUserId)) {
                logger_1.Logger.internal.verbose('Calling Database.getUserId!');
                const userId = Database.getUserId(payload, options);
                logger_1.Logger.internal.verbose('Adding user id to the params!');
                params.push(userId);
            }
            for (let i = 0; i < fieldsToPass.length; i++) {
                params.push(payload[fieldsToPass[i]]);
            }
            logger_1.Logger.internal.verbose('Calling function with functionName and params!');
            logger_1.Logger.log(functionName, params);
            let data = yield db.func(functionName, params);
            logger_1.Logger.internal.verbose('Function returned successfully!');
            logger_1.Logger.internal.verbose('Formatting return value!');
            if (data instanceof Array) {
                if (data.length === 0) {
                    data = null;
                }
                else if (data[0].hasOwnProperty(functionName)) {
                    data = data[0][functionName];
                }
            }
            logger_1.Logger.internal.verbose('Returning data!');
            logger_1.Logger.internal.debug(data);
            return data;
        });
    }
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
    static getUserId(payload, options) {
        var _a;
        logger_1.Logger.internal.verbose('Database.getUserId');
        if (options === null || options === void 0 ? void 0 : options.identity) {
            logger_1.Logger.internal.debug('Overriding user id with options.identity!');
            logger_1.Logger.internal.sensitive('Cognito Identity ID', options.identity.cognitoIdentityId);
            return options.identity.cognitoIdentityId;
        }
        if (options === null || options === void 0 ? void 0 : options.userId) {
            logger_1.Logger.internal.debug('Overriding user id with options.userId!');
            logger_1.Logger.internal.sensitive(`User ID`, options.userId);
            return options.userId;
        }
        if ((0, api_1.isHttpApiEventWithAuthorizer)(payload)) {
            logger_1.Logger.internal.debug('Overriding user id with payload.requestContext.authorizer.lambda.cognitoIdentityId!');
            const identityId = payload.requestContext.authorizer.lambda.cognitoIdentityId;
            logger_1.Logger.internal.sensitive('Cognito Identity ID', identityId);
            return identityId;
        }
        const isContext = (payload) => {
            var _a;
            return (_a = payload === null || payload === void 0 ? void 0 : payload.identity) === null || _a === void 0 ? void 0 : _a.cognitoIdentityId;
        };
        if (isContext(payload) && ((_a = payload.identity) === null || _a === void 0 ? void 0 : _a.cognitoIdentityId)) {
            logger_1.Logger.internal.debug('Overriding user id with payload.identity.cognitoIdentityId!');
            logger_1.Logger.internal.sensitive('Cognito Identity ID', payload.identity.cognitoIdentityId);
            return payload.identity.cognitoIdentityId;
        }
        if (payload === null || payload === void 0 ? void 0 : payload.federatedIdentityId) {
            logger_1.Logger.internal.debug('Overriding user id with payload.federatedIdentityId!');
            logger_1.Logger.internal.deprecated('options.userId should be used instead of payload.federatedIdentityId!');
            logger_1.Logger.internal.sensitive('Federated Identity ID', payload.federatedIdentityId);
            return payload.federatedIdentityId;
        }
        const message = 'Unable to determine a user ID! Please ensure that you are calling via an API Gateway authenticated with custom authorizer or that you have passed the options.userId manually!';
        logger_1.Logger.internal.error(401, message);
        throw new Error(message);
    }
    static isWarmUp(payload) {
        logger_1.Logger.internal.verbose('Database.isWarmUp');
        return !!payload.wu;
    }
    /**
     * Check if error is a PostgreSQL connection error
     * @private
     */
    static isConnectionError(error) {
        const connectionErrorCodes = [
            '28P01', // invalid_password
            '28000', // invalid_authorization_specification
            '08001', // sqlclient_unable_to_establish_sqlconnection
            '08006', // connection_failure
            'ECONNREFUSED',
            'ETIMEDOUT',
        ];
        return connectionErrorCodes.some(code => { var _a; return (error === null || error === void 0 ? void 0 : error.code) === code || ((_a = error === null || error === void 0 ? void 0 : error.message) === null || _a === void 0 ? void 0 : _a.includes(code)); });
    }
    /**
     * Build cache key for connection string
     * @private
     */
    static buildConnectionCacheKey(options) {
        var _a, _b, _c, _d, _e, _f;
        const app = (_d = (_b = (_a = options.ssm) === null || _a === void 0 ? void 0 : _a.app) !== null && _b !== void 0 ? _b : (_c = options.secretsmanager) === null || _c === void 0 ? void 0 : _c.app) !== null && _d !== void 0 ? _d : (0, index_1.getEnvironmentVariable)('APP');
        const stage = (0, index_1.getEnvironmentVariable)('STAGE');
        if (options.ssm) {
            const defaultSsmParameter = (0, index_1.getEnvironmentVariable)('SSM_PARAMETER');
            const defaultRoSsmParameter = (0, index_1.getEnvironmentVariable)('READ_ONLY_SSM_PARAMETER');
            const param = (_e = options.ssm.parameter) !== null && _e !== void 0 ? _e : (options.isReadOnly
                ? defaultRoSsmParameter
                : defaultSsmParameter);
            return `ssm:/${app}/${stage}/${param}`;
        }
        if (options.secretsmanager) {
            const defaultSecretsManagerParameter = (0, index_1.getEnvironmentVariable)('SECRETS_MANAGER_PARAMETER');
            const defaultRoSecretsManagerParameter = (0, index_1.getEnvironmentVariable)('READ_ONLY_SECRETS_MANAGER_PARAMETER');
            const param = (_f = options.secretsmanager.parameter) !== null && _f !== void 0 ? _f : (options.isReadOnly
                ? defaultRoSecretsManagerParameter
                : defaultSecretsManagerParameter);
            return `secrets:/${app}/${stage}/${param}`;
        }
        return '';
    }
}
exports.Database = Database;
Database.connections = {};
