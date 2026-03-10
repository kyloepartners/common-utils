"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Payload = void 0;
const logger_1 = require("../logger");
const api_gateway_interface_1 = require("./api-gateway.interface");
const responses_1 = require("./responses");
/**
 * @description This class is intended to enforce a standard for API payload.
 */
class Payload {
    /**
     * @description Attempts to identify the payload that should be passed to the Database based on the method.
     * The resulting payload is mapped as follows:
     * - GET -> Items from API path and query parameter only
     * - PUT -> Items from API path and body only
     * - POST -> Items from API path and body only
     * - DELETE -> Items from API path and query parameter only
     * - HEAD -> Items from API path and query parameter only
     *
     * All other methods are defaulted to API path, query parameter and body. Although using other methods should be avoided!
     */
    static fromMethod(event) {
        logger_1.Logger.internal.verbose('Payload.fromMethod');
        logger_1.Logger.internal.verbose('Determining payload from httpMethod!');
        const method = (0, api_gateway_interface_1.getHttpMethod)(event);
        logger_1.Logger.internal.debug('Mapping payload for method:', method);
        switch (method) {
            case 'PUT':
            case 'POST':
                return new Payload(Object.assign(Object.assign({}, Payload.fromPath(event)), Payload.fromBody(event)), false).as();
            case 'DELETE':
            case 'GET':
            case 'HEAD':
                return new Payload(Object.assign(Object.assign({}, Payload.fromPath(event)), Payload.fromQueryParams(event)), false).as();
            default:
                return new Payload(Object.assign(Object.assign(Object.assign({}, Payload.fromPath(event)), Payload.fromQueryParams(event)), Payload.fromBody(event)), false).as();
        }
    }
    /**
     * @description Maps all items from `event.body` to an object.
     */
    static fromBody(event) {
        logger_1.Logger.internal.verbose('Payload.fromBody');
        logger_1.Logger.internal.verbose('Checking event.body for nulls!');
        if (!event.body) {
            logger_1.Logger.internal.verbose('event.body is null, returning empty object!');
            return new Payload();
        }
        logger_1.Logger.internal.verbose('Parsing data and returning values!');
        try {
            const parsedBody = JSON.parse(event.body);
            return new Payload(parsedBody);
        }
        catch (e) {
            const message = 'Failed to parse "body" to JSON!';
            throw responses_1.Responses.internalError(message);
        }
    }
    /**
     * @description Maps all items from `event.pathParameters` to an object, it also attempts to parse the items to its correct type. Since `event.pathParameters` is an object of type `{[key: string]: string}` where all values are string. This methods attempts to identify the type of the value and parse it.
     *
     * If event is `{pathParameters: {item1: "test", item2: "2", item3: "[]', item4: '{"obj": "value"}'}}` it will parse the values to `{pathParameters: {item1: "test", item2: 2, item3: [], item4: {obj: "value"}}}`.
     *
     */
    static fromPath(event) {
        logger_1.Logger.internal.verbose('Payload.fromPathParams');
        return new Payload(event.pathParameters);
    }
    /**
     * @description Maps all items from `event.queryStringParameters` to an object, it also attempts to parse the items to its correct type. Since `event.queryStringParameters` is an object of type `{[key: string]: string}` where all values are string. This methods attempts to identify the type of the value and parse it.
     *
     * If event is `{pathParameters: {item1: "test", item2: "2", item3: "[]', item4: '{"obj": "value"}'}}` it will parse the values to `{pathParameters: {item1: "test", item2: 2, item3: [], item4: {obj: "value"}}}`.
     *
     */
    static fromQueryParams(event) {
        logger_1.Logger.internal.verbose('Payload.fromQueryParams');
        return new Payload(event.queryStringParameters);
    }
    constructor(payload, tryToResolveTypes = true) {
        logger_1.Logger.internal.verbose('Payload.determineTypes');
        logger_1.Logger.internal.verbose('Checking payload for nulls');
        if (!payload) {
            logger_1.Logger.internal.verbose('Payload is null returning empty object!');
            return this;
        }
        logger_1.Logger.internal.verbose('Adding data to object');
        for (const key in payload) {
            if (payload.hasOwnProperty(key)) {
                logger_1.Logger.internal.verbose('Adding new data!');
                if (tryToResolveTypes) {
                    this[key] = this.determineType(payload[key]);
                }
                else {
                    this[key] = payload[key];
                }
            }
        }
    }
    determineType(value) {
        logger_1.Logger.internal.verbose('Payload.determineType');
        logger_1.Logger.internal.debug(value);
        logger_1.Logger.internal.verbose('Checking null');
        if (value === 'null' || value === null || value === undefined) {
            return null;
        }
        logger_1.Logger.internal.verbose('Checking undefined');
        if (value === 'undefined') {
            return undefined;
        }
        logger_1.Logger.internal.verbose('Checking if value is a string');
        if (typeof value !== 'string') {
            logger_1.Logger.internal.verbose('Value is not a string, returning as is!');
            return value;
        }
        const decodedValue = decodeURIComponent(value);
        try {
            logger_1.Logger.internal.verbose('Trying to parse!');
            return JSON.parse(decodedValue);
        }
        catch (e) {
            logger_1.Logger.internal.verbose('Failed to parse, returning as a string!');
            return decodedValue;
        }
    }
    as() {
        return this;
    }
}
exports.Payload = Payload;
