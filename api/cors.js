"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cors = void 0;
const index_1 = require("../index");
const logger_1 = require("../logger");
const api_gateway_interface_1 = require("./api-gateway.interface");
class Cors {
    constructor(allowedOrigins, allowedMethods, allowedHeaders = Cors.DEFAULT_HEADERS) {
        this.allowedOrigins = allowedOrigins;
        this.allowedMethods = allowedMethods;
        this.allowedHeaders = allowedHeaders;
        logger_1.Logger.internal.verbose('Cors.constructor');
    }
    /**
     * @description checks if the request is from an allowed origin.
     * @param event - The API Gateway event.
     * @returns true if the request is from an allowed origin, false otherwise.
     */
    isValid(event) {
        var _a, _b, _c, _d;
        logger_1.Logger.internal.verbose('Cors.isValid');
        const origin = (_d = (_b = (_a = event === null || event === void 0 ? void 0 : event.headers) === null || _a === void 0 ? void 0 : _a.Origin) !== null && _b !== void 0 ? _b : (_c = event === null || event === void 0 ? void 0 : event.headers) === null || _c === void 0 ? void 0 : _c.origin) !== null && _d !== void 0 ? _d : null;
        console.log(this.allowedOrigins, origin);
        if (!origin)
            return false;
        if (!this.allowedOrigins.includes(origin) && !this.allowedOrigins.includes('*'))
            return false;
        if ((0, api_gateway_interface_1.isRestApiEvent)(event)) {
            if (!this.allowedMethods.includes(event.httpMethod))
                return false;
        }
        else if ((0, api_gateway_interface_1.isHttpApiEvent)(event)) {
            if (!this.allowedMethods.includes(event.requestContext.http.method))
                return false;
        }
        else {
            return false;
        }
        logger_1.Logger.internal.verbose('Cors.isValid: true');
        return true;
    }
    isInvalid(event) {
        return !this.isValid(event);
    }
    buildHeaders(event) {
        var _a, _b, _c, _d;
        const headers = {};
        const origin = (_d = (_b = (_a = event === null || event === void 0 ? void 0 : event.headers) === null || _a === void 0 ? void 0 : _a.Origin) !== null && _b !== void 0 ? _b : (_c = event === null || event === void 0 ? void 0 : event.headers) === null || _c === void 0 ? void 0 : _c.origin) !== null && _d !== void 0 ? _d : null;
        if (this.isValid(event)) {
            headers['Access-Control-Allow-Headers'] = this.allowedHeaders.join(',');
            headers['Access-Control-Allow-Methods'] = this.allowedMethods.join(',');
            if (origin)
                headers['Access-Control-Allow-Origin'] = origin;
        }
        else if ((0, index_1.getEnvironmentVariable)('STAGE') === 'dev') {
            logger_1.Logger.internal.verbose(`Current STAGE is dev, setting origin to localhost with port ${(0, index_1.getEnvironmentVariable)('LOCALHOST_PORT')}`);
            headers['Access-Control-Allow-Origin'] = `http://localhost:${(0, index_1.getEnvironmentVariable)('LOCALHOST_PORT')}`;
        }
        return headers;
    }
}
exports.Cors = Cors;
Cors.DEFAULT_HEADERS = ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key', 'X-Amz-Security-Token', 'X-Amz-User-Agent'];
