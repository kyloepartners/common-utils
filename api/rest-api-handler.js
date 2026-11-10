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
exports.identityFromRestApiEvent = identityFromRestApiEvent;
exports.createRestApiHandler = createRestApiHandler;
const index_1 = require("../index");
const logger_1 = require("../logger");
const cors_1 = require("./cors");
const payload_1 = require("./payload");
const responses_1 = require("./responses");
const USER_TYPES = ['candidate', 'staff'];
const defaultAllowedOrigins = () => {
    const origins = process.env.ORIGIN ? [process.env.ORIGIN] : [];
    if (String((0, index_1.getEnvironmentVariable)('STAGE')).startsWith('dev')) {
        origins.push('http://localhost:4200');
    }
    return origins;
};
/**
 * @description Reads the caller from a REST API Lambda authorizer's context. Returns null when the method has
 * no authorizer or the context is incomplete.
 */
function identityFromRestApiEvent(event) {
    var _a;
    const authorizer = (_a = event === null || event === void 0 ? void 0 : event.requestContext) === null || _a === void 0 ? void 0 : _a.authorizer;
    const { cognitoId, cognitoIdentityId, userType } = authorizer !== null && authorizer !== void 0 ? authorizer : {};
    if (typeof cognitoId !== 'string' || !cognitoId)
        return null;
    if (typeof cognitoIdentityId !== 'string' || !cognitoIdentityId)
        return null;
    if (!USER_TYPES.includes(userType))
        return null;
    return { cognitoId, cognitoIdentityId, userType: userType };
}
const allows = (access, identity) => access === 'authenticated' || access === identity.userType;
// Unexpected errors are logged in full but never returned, since public routes have unauthenticated callers
const genericError = (error) => {
    logger_1.Logger.error(500, 'Unhandled error in REST API route', error);
    return responses_1.Responses.internalError('This operation failed unexpectedly!');
};
/**
 * @description Builds one Lambda handler for several REST API routes, matched on `METHOD /resource`. It checks the
 * origin, who may call the route, and any required roles before calling the route's action.
 *
 * ```typescript
 * export const handler = createRestApiHandler({
 *   'GET /public/brands': {access: 'public', action: async () => Responses.success('Brands', await getBrands())},
 *   'GET /brands/{brandId}/labels': {
 *     access: 'staff',
 *     roles: ['user:brand-admin'],
 *     action: async ({payload, identity}) => Responses.success('Labels', await getLabels(payload.brandId, identity!)),
 *   },
 * }, {authorizeRoles: (identity, roles) => isUserAuthorized(identity, roles)});
 * ```
 */
function createRestApiHandler(routes, options = {}) {
    var _a, _b, _c;
    for (const [route, definition] of Object.entries(routes)) {
        if (((_a = definition === null || definition === void 0 ? void 0 : definition.roles) === null || _a === void 0 ? void 0 : _a.length) && definition.access === 'public') {
            throw new Error(`${route}: a public route cannot require roles.`);
        }
        if (((_b = definition === null || definition === void 0 ? void 0 : definition.roles) === null || _b === void 0 ? void 0 : _b.length) && !options.authorizeRoles) {
            throw new Error(`${route}: roles require the authorizeRoles option.`);
        }
    }
    const methods = [...new Set(Object.keys(routes).map((route) => route.split(' ')[0]))];
    const cors = new cors_1.Cors((_c = options.allowedOrigins) !== null && _c !== void 0 ? _c : defaultAllowedOrigins(), methods);
    const route = (event, context) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        if (cors.isInvalid(event)) {
            return responses_1.Responses.forbidden('Unauthorized origin!');
        }
        const name = `${event.httpMethod} ${event.resource}`;
        const definition = routes[name];
        if (!definition) {
            return responses_1.Responses.notFound(`Route not found: ${name}`);
        }
        const identity = definition.access === 'public' ? null : identityFromRestApiEvent(event);
        if (definition.access !== 'public') {
            if (!identity) {
                return responses_1.Responses.unauthorized('Unauthorized');
            }
            if (!allows(definition.access, identity)) {
                return responses_1.Responses.forbidden('Forbidden');
            }
            if (((_a = definition.roles) === null || _a === void 0 ? void 0 : _a.length) && !(yield options.authorizeRoles(identity, definition.roles))) {
                return responses_1.Responses.forbidden('Forbidden');
            }
        }
        return definition.action({ event, context, identity, payload: payload_1.Payload.fromMethod(event) });
    });
    return (0, index_1.createLambda)((event, context) => route(event, context), genericError, (response, event) => response.setCors(event, cors));
}
