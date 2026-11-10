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
exports.Database = void 0;
const database_1 = require("../database");
const responses_1 = require("./responses");
const logger_1 = require("../logger");
const payload_1 = require("./payload");
/**
 * @description This is a wrapper class for the Database class from [`common-utils/database`](https://github.com/Cordant/common-utils/blob/master/database/index.ts) intended to be used for the APIs.
 * It maps the LambdaEvent received based on the API method and passes it as an object to the Database.
 */
class Database {
    /**
     * @description Calls the read/write database.
     *
     * ```typescript
     * const {Database} = require('common-utils/api');
     *
     * Database.process(
     *   event,
     *   functionName,
     *   fieldsToPass,
     *   'Success Message',
     *   'Failed Message',
     *   options, // Optional
     * ).then(data => {...Bunch of code...})
     *  .catch(err => {...Bunch of code...})
     * ```
     *
     * @param event This is the value receive from the lambda directly.
     * @param functionName The name of the database stored procedure to call.
     * @param fieldsToPass The fields from the event that should be passed to the stored procedure. This order of the item in the list must match the order of the stored procedure parameters. Please note that the user id is always passed as the first argument and therefore must not be included on this list.
     * @param successMessage A user-friendly message that will be displayed to the end user when this call succeeds.
     * @param errorMessage A user-friendly message that will be displayed to the end if this call fails.
     * @param options An optional set of parameters that can be passed to the database. See [ProcessOptions](https://github.com/Cordant/common-utils/blob/master/api/index.ts#L7) for more details
     */
    static process(event, functionName, fieldsToPass, successMessage, errorMessage, options) {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.Logger.internal.verbose('APIDatabase.process');
            try {
                logger_1.Logger.internal.verbose('Mapping lambda event to payload!');
                const payload = payload_1.Payload.fromMethod(event);
                logger_1.Logger.internal.debug(payload);
                logger_1.Logger.internal.verbose('Calling InternalDatabase.process!');
                const data = yield database_1.Database.process(payload, functionName, fieldsToPass, options);
                logger_1.Logger.internal.verbose('Creating appropriate success response object!');
                return responses_1.Responses.success(successMessage, data);
            }
            catch (e) {
                logger_1.Logger.internal.verbose('Creating appropriate failed response object!');
                return Database.handleError(e, errorMessage);
            }
        });
    }
    /**
     * @description Calls the read only database.
     *
     * ```typescript
     * const {Database} = require('common-utils/api');
     *
     * Database.processReadOnly(
     *   event,
     *   functionName,
     *   fieldsToPass,
     *   'Success Message',
     *   'Failed Message',
     *   options, // Optional
     * ).then(data => {...Bunch of code...})
     *  .catch(err => {...Bunch of code...})
     * ```
     *
     * @param event This is the value receive from the lambda directly.
     * @param functionName The name of the database stored procedure to call.
     * @param fieldsToPass The fields from the event that should be passed to the stored procedure. This order of the item in the list must match the order of the stored procedure parameters. Please note that the user id is always passed as the first argument and therefore must not be included on this list.
     * @param successMessage A user-friendly message that will be displayed to the end user when this call succeeds.
     * @param errorMessage A user-friendly message that will be displayed to the end if this call fails.
     * @param options An optional set of parameters that can be passed to the database. See [ProcessOptions](https://github.com/Cordant/common-utils/blob/master/api/index.ts#L7) for more details
     */
    static processReadOnly(event, functionName, fieldsToPass, successMessage, errorMessage, options) {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.Logger.internal.verbose('APIDatabase.processReadOnly');
            try {
                logger_1.Logger.internal.verbose('Mapping lambda event to payload!');
                const payload = payload_1.Payload.fromMethod(event);
                logger_1.Logger.internal.debug(payload);
                logger_1.Logger.internal.verbose('Calling InternalDatabase.processReadOnly!');
                const data = yield database_1.Database.processReadOnly(payload, functionName, fieldsToPass, options);
                logger_1.Logger.internal.verbose('Creating appropriate success response object!');
                return responses_1.Responses.success(successMessage, data);
            }
            catch (e) {
                logger_1.Logger.internal.verbose('Creating appropriate failed response object!');
                return Database.handleError(e, errorMessage);
            }
        });
    }
    /**
     * @description Tries to identify if the error is coming from an AWS Service and though and error based on the status code, otherwise return error as internal error (status code 500).
     *
     * @param error The error object received from the catch statement.
     * @param errorMessage A user-friendly error message that will be passed to the user in the frontend.
     * @private
     */
    static handleError(error, errorMessage) {
        var _a;
        logger_1.Logger.internal.verbose('APIDatabase.handleError');
        logger_1.Logger.internal.verbose('Checking if error was thrown by AWS!');
        if ((_a = error === null || error === void 0 ? void 0 : error.$metadata) === null || _a === void 0 ? void 0 : _a.httpStatusCode) {
            logger_1.Logger.internal.verbose('Creating AWS failed appropriate response object!');
            logger_1.Logger.error(error.$metadata.httpStatusCode, error);
            return responses_1.Responses.error(error.$metadata.httpStatusCode, errorMessage);
        }
        logger_1.Logger.internal.verbose('Creating unknown failed response object!');
        return responses_1.Responses.internalError(errorMessage, error);
    }
}
exports.Database = Database;
