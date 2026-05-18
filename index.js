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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnvironmentVariable = getEnvironmentVariable;
exports.createLambda = createLambda;
const api_1 = require("./api");
const logger_1 = require("./logger");
const smithy_client_1 = require("@aws-sdk/smithy-client");
function getEnvironmentVariable(name) {
    var _a, _b, _c, _d, _e, _f, _g;
    switch (name) {
        case 'STAGE':
            return (_b = (_a = process.env.STAGE) !== null && _a !== void 0 ? _a : process.env.stage) !== null && _b !== void 0 ? _b : 'dev';
        case 'DEBUG':
            return process.env.DEBUG === 'true' || process.env.debug === 'true';
        case 'VERBOSE':
            return process.env.VERBOSE === 'true' || process.env.verbose === 'true';
        case 'INTERNAL':
            return process.env.INTERNAL === 'true' || process.env.internal === 'true';
        case 'SENSITIVE':
            return process.env.SENSITIVE === 'true' || process.env.sensitive === 'true';
        case 'REGION':
            const region = (_e = (_d = (_c = process.env.AWS_REGION) !== null && _c !== void 0 ? _c : process.env.AWS_DEFAULT_REGION) !== null && _d !== void 0 ? _d : process.env.REGION) !== null && _e !== void 0 ? _e : process.env.region;
            if (!region) {
                logger_1.Logger.internal.error(`No region found in environment variables!`);
                throw new Error(`No region found in environment variables!`);
            }
            return region;
        case 'LOCALHOST_PORT':
            return +((_g = (_f = process.env.LOCALHOST_PORT) !== null && _f !== void 0 ? _f : process.env.localhost_port) !== null && _g !== void 0 ? _g : '') || 8100;
        default:
            return process.env[name];
    }
}
function isWarmUp(event) {
    return !!(event === null || event === void 0 ? void 0 : event.wu);
}
function isAwsSdkV2Error(error) {
    return typeof (error === null || error === void 0 ? void 0 : error.statusCode) === 'number' && typeof (error === null || error === void 0 ? void 0 : error.code) === 'string';
}
function serializeError(error) {
    return Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, ((error === null || error === void 0 ? void 0 : error.name) && { name: error.name })), ((error === null || error === void 0 ? void 0 : error.message) && { message: error.message })), ((error === null || error === void 0 ? void 0 : error.code) && { code: error.code })), ((error === null || error === void 0 ? void 0 : error.stack) && { stack: error.stack })), error);
}
function defaultErrorHandler(error) {
    var _a, _b;
    logger_1.Logger.internal.warning('No errorHandler was passed, generating default error response!');
    logger_1.Logger.internal.verbose('Checking if error was thrown by AWS!');
    const serialized = serializeError(error);
    if (error instanceof smithy_client_1.ServiceException) {
        logger_1.Logger.internal.verbose('Creating AWS SDK v3 failed appropriate response object!');
        return api_1.Responses.error((_a = error.$metadata.httpStatusCode) !== null && _a !== void 0 ? _a : 400, 'This operation failed unexpectedly!', serialized);
    }
    if ((_b = error === null || error === void 0 ? void 0 : error.$metadata) === null || _b === void 0 ? void 0 : _b.httpStatusCode) {
        logger_1.Logger.internal.verbose('Creating AWS SDK v3 failed appropriate response object!');
        return api_1.Responses.error(error.$metadata.httpStatusCode, 'This operation failed unexpectedly!', serialized);
    }
    if (isAwsSdkV2Error(error)) {
        logger_1.Logger.internal.verbose('Creating AWS SDK v2 failed appropriate response object!');
        return api_1.Responses.error(error.statusCode, 'This operation failed unexpectedly!', serialized);
    }
    logger_1.Logger.internal.verbose('Creating unknown failed response object!');
    return api_1.Responses.internalError('This operation failed unexpectedly!', serialized);
}
function defaultTransformer(responses) {
    logger_1.Logger.internal.verbose('Transforming response!');
    return responses;
}
/**
 * @description Checks for the Warm-Up flag and ensures the function is only called if it not a warm-up call. It also handles any unexpect error.
 *
 * ```typescript
 * module.exports.handler = createLambda(async (event) => {
 *  ... Lambda Code ...
 * });
 * ```
 */
function createLambda(handler, onError = defaultErrorHandler, transformer = defaultTransformer) {
    logger_1.Logger.setConfig({ globalTrace: true });
    logger_1.Logger.internal.verbose('createLambda');
    return (...args) => __awaiter(this, void 0, void 0, function* () {
        const [event, context] = args;
        const internalWrapper = () => __awaiter(this, void 0, void 0, function* () {
            logger_1.Logger.internal.verbose('Checking warm up!');
            if (isWarmUp(event) && event.wu) {
                logger_1.Logger.log('Function Warm Up called! Skipping calling actual function!');
                return api_1.Responses.success('Function warmed up successfully!');
            }
            if (api_1.Responses.DEFAULT_CORS && api_1.Responses.DEFAULT_CORS.isInvalid(event)) {
                logger_1.Logger.internal.verbose('Request is from an unauthorized origin or method!');
                return api_1.Responses.forbidden('Unauthorized origin!');
            }
            logger_1.Logger.internal.verbose('Calling handler and returning it!');
            let hasError = false;
            try {
                logger_1.Logger.resetTrace();
                logger_1.Logger.log('START');
                return yield handler(...args);
            }
            catch (error) {
                hasError = true;
                logger_1.Logger.internal.verbose('An error occurred when calling handler!');
                if (error instanceof api_1.Responses) {
                    logger_1.Logger.internal.verbose('Returning error response!');
                    logger_1.Logger.internal.error(error);
                    return error;
                }
                logger_1.Logger.internal.verbose('Handling error using onError!');
                try {
                    return yield onError(error);
                }
                catch (err) {
                    logger_1.Logger.internal.warning('Trying to call onError failed! Returning a generic error!');
                    logger_1.Logger.internal.error(err);
                    if (err instanceof api_1.Responses) {
                        return err;
                    }
                    return api_1.Responses.internalError('An unexpected error occurred!', serializeError(error));
                }
            }
            finally {
                logger_1.Logger.log('END');
                // If there was an error, we want to log the trace.
                // Doing it here to ensure that the trace is the last thing logged.
                if (hasError && logger_1.Logger.getInstance().shouldTraceGlobally) {
                    logger_1.Logger.logTrace();
                }
            }
        });
        const response = yield internalWrapper();
        const transformed = transformer(response, event, context);
        if (api_1.Responses.DEFAULT_CORS && !transformed.headers['Access-Control-Allow-Origin']) {
            transformed.setCors(event, api_1.Responses.DEFAULT_CORS);
        }
        return transformed;
    });
}
