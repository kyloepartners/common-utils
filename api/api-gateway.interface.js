"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRestApiEvent = isRestApiEvent;
exports.isHttpApiEvent = isHttpApiEvent;
exports.isHttpApiEventWithAuthorizer = isHttpApiEventWithAuthorizer;
exports.isRestApiCognitoAuthorizerEvent = isRestApiCognitoAuthorizerEvent;
exports.getHttpMethod = getHttpMethod;
const responses_1 = require("./responses");
function isRestApiEvent(event) {
    return !!(event === null || event === void 0 ? void 0 : event.httpMethod);
}
function isHttpApiEvent(event) {
    return (event === null || event === void 0 ? void 0 : event.version) === '2.0';
}
function isHttpApiEventWithAuthorizer(event) {
    var _a, _b, _c, _d, _e, _f;
    if (!((_c = (_b = (_a = event === null || event === void 0 ? void 0 : event.requestContext) === null || _a === void 0 ? void 0 : _a.authorizer) === null || _b === void 0 ? void 0 : _b.lambda) === null || _c === void 0 ? void 0 : _c.cognitoId))
        return false;
    if (!((_f = (_e = (_d = event === null || event === void 0 ? void 0 : event.requestContext) === null || _d === void 0 ? void 0 : _d.authorizer) === null || _e === void 0 ? void 0 : _e.lambda) === null || _f === void 0 ? void 0 : _f.cognitoIdentityId))
        return false;
    return true;
}
function isRestApiCognitoAuthorizerEvent(event) {
    var _a, _b;
    return !!((_b = (_a = event === null || event === void 0 ? void 0 : event.requestContext) === null || _a === void 0 ? void 0 : _a.authorizer) === null || _b === void 0 ? void 0 : _b.claims);
}
function getHttpMethod(event) {
    if (isRestApiEvent(event)) {
        return event.httpMethod.toUpperCase();
    }
    if (isHttpApiEvent(event)) {
        return event.requestContext.http.method.toUpperCase();
    }
    throw responses_1.Responses.internalError('Unknown event type!');
}
