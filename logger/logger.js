"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.LogType = void 0;
const index_1 = require("../index");
const status_code_1 = require("./status-code");
var LogType;
(function (LogType) {
    LogType["log"] = "LOG";
    LogType["debug"] = "DEBUG";
    LogType["verbose"] = "VERBOSE";
    LogType["sensitive"] = "SENSITIVE";
    LogType["error"] = "ERROR";
    LogType["warning"] = "WARNING";
    LogType["deprecated"] = "DEPRECATED";
    LogType["awsError"] = "AWS_ERROR";
})(LogType || (exports.LogType = LogType = {}));
/**
 * @description This class is used to standardize message logging, it ensures that all message has a standard format following `[TYPE][FUNCTION_NAME][...OTHER OPTIONS] message with details`
 */
class Logger {
    constructor() {
        this.type = LogType.log;
        this.isInternal = false;
        this.shouldTraceGlobally = false;
        this.traces = [];
        this.logTypesToTrack = [
            LogType.log,
            LogType.debug,
            LogType.verbose,
            LogType.sensitive,
            LogType.error,
            LogType.warning,
            LogType.deprecated,
            LogType.awsError,
        ];
    }
    static setConfig({ globalTrace = false, logTypesToTrack }) {
        Logger.isSingleton = globalTrace;
        const logger = Logger.getInstance();
        logger.shouldTraceGlobally = globalTrace;
        if (logTypesToTrack) {
            logger.logTypesToTrack = logTypesToTrack;
        }
    }
    static getInstance() {
        if (!Logger.isSingleton) {
            return new Logger();
        }
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }
    /**
     * @description Logs message only if the INTERNAL environment variable is 'true'. You probably shouldn't be using it!
     *
     * ```typescript
     * Logger.internal.log('User-friendly message');
     * Logger.internal.debug('User-friendly message');
     * ```
     *
     */
    static get internal() {
        const logger = Logger.getInstance();
        logger.isInternal = true;
        return logger;
    }
    static log(...messages) {
        Logger.getInstance().log(...messages);
    }
    static debug(...messages) {
        Logger.getInstance().debug(...messages);
    }
    static verbose(...messages) {
        Logger.getInstance().verbose(...messages);
    }
    /**
     * @description Logs message everytime, but it will only should the `data` if the environment variable SENSITIVE is 'true' or STAGE is 'dev' otherwise it will redact the `data`.
     * @example [SENSITIVE][lambda_function_name] email: <REDACTED>
     */
    static sensitive(type, data) {
        Logger.getInstance().sensitive(type, data);
    }
    static warning(...messages) {
        Logger.getInstance().warning(...messages);
    }
    static deprecated(...messages) {
        Logger.getInstance().deprecated(...messages);
    }
    static error(...args) {
        Logger.getInstance().error(...args);
    }
    /**
     * @description Logs error message everytime. This should be called in every AWS Services catch parameter. It gets the httpStatusCode from the error object and
     * @example [ERROR][lambda_function_name][500][Internal Error][AwsErrorCode] {"data": "value"}
     */
    static awsError(data) {
        Logger.getInstance().awsError(data);
    }
    static logTrace() {
        Logger.getInstance().logTrace();
    }
    static resetTrace() {
        Logger.getInstance().resetTrace();
    }
    /**
     * @description Logs message everytime.
     * @example [LOG][lambda_function_name] message
     */
    log(...messages) {
        this.type = LogType.log;
        const message = this.getLogMessage(messages);
        if (this.shouldLog && this.shouldLogIfInternal) {
            console.log(message);
        }
        this.isInternal = false;
    }
    /**
     * @description Logs message only if STAGE is 'dev' or 'demo' or if the environment variable DEBUG is passed as 'true' in 'prod'.
     * @example [DEBUG][lambda_function_name] message
     */
    debug(...messages) {
        this.type = LogType.debug;
        const message = this.getLogMessage(messages);
        if (this.shouldLog && this.shouldLogIfInternal) {
            console.log(message);
        }
        this.isInternal = false;
    }
    /**
     * @description Logs message only if the environment variable VERBOSE is passed as 'true'.
     * @example [VERBOSE][lambda_function_name] message
     */
    verbose(...messages) {
        this.type = LogType.verbose;
        const message = this.getLogMessage(messages);
        if (this.shouldLog && this.shouldLogIfInternal) {
            console.log(message);
        }
        this.isInternal = false;
    }
    /**
     * @description Logs message everytime, but it will only should the `data` if the environment variable SENSITIVE is 'true' or STAGE is 'dev' otherwise it will redact the `data`.
     * @example [SENSITIVE][lambda_function_name] email: <REDACTED>
     */
    sensitive(type, data) {
        this.type = LogType.sensitive;
        const message = this.getLogMessage([type, data]);
        if (this.shouldLogIfInternal) {
            console.log(message);
        }
        this.isInternal = false;
    }
    /**
     * @description Logs message everytime. Should be used when a non-breaking error occurred.
     * @example [WARNING][lambda_function_name] user-friendly message.
     */
    warning(...messages) {
        this.type = LogType.warning;
        const message = this.getLogMessage(messages);
        console.log(message);
        this.isInternal = false;
    }
    /**
     * @description Logs message everytime. Should be used when a deprecation functionality is used and will be removed in the future.
     * @example [DEPRECATED][lambda_function_name] user-friendly message.
     */
    deprecated(...messages) {
        this.type = LogType.deprecated;
        const message = this.getLogMessage(messages);
        console.log(message);
        this.isInternal = false;
    }
    /**
     * @description Logs error message everytime. If you pass only one parameter it will treat it as a user-friendly message that can be display for the user if you pass 2 parameter, it will assume the first parameter is the error code for a standard API response.
     * @example [ERROR][lambda_function_name][500][Internal Error] user-friendly message
     */
    error(...args) {
        this.type = LogType.error;
        const message = this.getLogMessage(args);
        console.error(message);
        this.isInternal = false;
    }
    /**
     * @description Logs error message everytime. This should be called in every AWS Services catch parameter. It gets the httpStatusCode from the error object and
     * @example [ERROR][lambda_function_name][500][Internal Error][AwsErrorCode] {"data": "value"}
     */
    awsError(data) {
        this.type = LogType.awsError;
        const message = this.getLogMessage([data]);
        console.error(message);
        this.isInternal = false;
    }
    logTrace() {
        console.log('Logging trace!');
        for (const trace of this.traces) {
            if (this.logTypesToTrack.includes(trace.type)) {
                console.log(trace.message);
            }
        }
        console.log('Logging trace finished!');
    }
    resetTrace() {
        this.traces = [];
    }
    prefixPart(name) {
        if (name) {
            return `[${name}]`;
        }
        return '';
    }
    getLogMessage(messages) {
        const message = this.buildMessage(messages);
        this.traces.push({ type: this.type, message });
        return message;
    }
    buildMessage(messages) {
        var _a, _b;
        if (this.type === LogType.sensitive) {
            if (this.shouldLog) {
                try {
                    return `${this.prefix} ${messages[0]}: ${JSON.stringify(messages[1], null, 2)}`;
                }
                catch (e) {
                    return `${this.prefix} ${messages[0]}: ${messages[1]}`;
                }
            }
            return `${this.prefix} ${messages[0]}: <REDACTED>`;
        }
        if (this.type === LogType.error && messages.length > 1) {
            const [statusCode, ...message] = messages;
            let extraPrefix = this.prefixPart(statusCode); // Status Code
            extraPrefix += this.prefixPart(status_code_1.StatusCode.getMessage(statusCode)); // Status Code Message
            return `${this.prefix}${extraPrefix} ${this.stringifyMessages(message)}`;
        }
        if (this.type === LogType.awsError) {
            const [data] = messages;
            let extraPrefix = this.prefixPart((_a = data === null || data === void 0 ? void 0 : data.$metadata) === null || _a === void 0 ? void 0 : _a.httpStatusCode); // AWS Error Status Code
            extraPrefix += this.prefixPart(status_code_1.StatusCode.getMessage((_b = data === null || data === void 0 ? void 0 : data.$metadata) === null || _b === void 0 ? void 0 : _b.httpStatusCode)); // AWS Error Status Code Message
            extraPrefix += this.prefixPart(data === null || data === void 0 ? void 0 : data.name); // AWS Error Code
            return `${this.prefix}${extraPrefix} ${this.stringifyMessages(messages)}`;
        }
        return `${this.prefix} ${this.stringifyMessages(messages)}`;
    }
    stringifyMessages(messages) {
        return messages.map(x => {
            if (typeof x === 'string') {
                return x;
            }
            try {
                return JSON.stringify(x);
            }
            catch (e) {
                return x;
            }
        }).join(' ');
    }
    get shouldLogIfInternal() {
        if (this.isInternal) {
            return (0, index_1.getEnvironmentVariable)('INTERNAL');
        }
        return true;
    }
    get shouldLog() {
        const stage = (0, index_1.getEnvironmentVariable)('STAGE');
        switch (this.type) {
            case LogType.debug:
                const shouldLogDebug = (0, index_1.getEnvironmentVariable)('DEBUG');
                return (shouldLogDebug || stage === 'dev' || stage === 'demo');
            case LogType.verbose:
                const shouldLogVerbose = (0, index_1.getEnvironmentVariable)('VERBOSE');
                return shouldLogVerbose;
            case LogType.sensitive:
                const shouldLogSensitive = (0, index_1.getEnvironmentVariable)('SENSITIVE');
                return (shouldLogSensitive || stage === 'dev');
            case LogType.log:
            case LogType.error:
            case LogType.warning:
            case LogType.deprecated:
            case LogType.awsError:
            default:
                return true;
        }
    }
    get prefix() {
        let prefix = this.prefixPart(this.type);
        if (this.type === LogType.awsError) {
            prefix = '[ERROR]';
        }
        prefix += this.prefixPart((0, index_1.getEnvironmentVariable)('AWS_LAMBDA_FUNCTION_NAME'));
        return prefix;
    }
}
exports.Logger = Logger;
Logger.isSingleton = false;
