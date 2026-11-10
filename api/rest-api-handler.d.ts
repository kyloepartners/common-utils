import { Context } from 'aws-lambda';
import { RestApiEvent } from './api-gateway.interface';
import { Responses } from './responses';
export type RestApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
/**
 * @description `METHOD /resource`, where resource is the API Gateway resource path, e.g. `GET /brands/{brandId}`.
 */
export type RestApiRoute = `${RestApiMethod} /${string}`;
/**
 * @description Who may call a route.
 * - `public`: anyone, no authorizer on the method.
 * - `candidate` / `staff`: only that kind of signed-in user.
 * - `authenticated`: any signed-in user.
 */
export type RouteAccess = 'public' | 'candidate' | 'staff' | 'authenticated';
export type ApiUserType = 'candidate' | 'staff';
/**
 * @description The caller, as resolved by the API's Lambda authorizer from a verified Cognito ID token.
 * `cognitoIdentityId` is the identity pool id the database knows the user by, so it can be passed straight
 * to `Database.process(..., {identity})`.
 */
export interface ApiIdentity {
    cognitoId: string;
    cognitoIdentityId: string;
    userType: ApiUserType;
}
export interface RouteActionArgs<TPayload = Record<string, any>> {
    event: RestApiEvent;
    context: Context;
    identity: ApiIdentity | null;
    /**
     * @description Path, query and body parameters, as `Payload.fromMethod` maps them for the method.
     */
    payload: TPayload;
}
export interface RouteDefinition {
    access: RouteAccess;
    /**
     * @description The caller needs at least one of these roles, checked with `RestApiHandlerOptions.authorizeRoles`.
     * Only valid on signed-in routes.
     */
    roles?: string[];
    action: (args: RouteActionArgs) => Promise<Responses> | Responses;
}
export type RestApiRoutes = Partial<Record<RestApiRoute, RouteDefinition>>;
export interface RestApiHandlerOptions {
    /**
     * @description Origins allowed to call the API. Defaults to the `ORIGIN` environment variable, plus the local
     * dev server on dev stages. Requests from any other origin are rejected.
     */
    allowedOrigins?: string[];
    /**
     * @description Resolves whether the caller has one of the roles a route requires. Roles live in each app's
     * database, so the app supplies this. Return false when the caller lacks them, throw for unexpected failures.
     */
    authorizeRoles?: (identity: ApiIdentity, roles: string[]) => Promise<boolean>;
}
/**
 * @description Reads the caller from a REST API Lambda authorizer's context. Returns null when the method has
 * no authorizer or the context is incomplete.
 */
export declare function identityFromRestApiEvent(event: RestApiEvent): ApiIdentity | null;
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
export declare function createRestApiHandler(routes: RestApiRoutes, options?: RestApiHandlerOptions): (event: import("aws-lambda").APIGatewayProxyEvent, context: Context, callback?: import("aws-lambda").Callback<Responses> | undefined) => Responses | Promise<Responses>;
