import { APIGatewayEvent, HTTPMethods } from './api-gateway.interface';
export declare class Cors {
    allowedOrigins: string[];
    allowedMethods: HTTPMethods[];
    allowedHeaders: string[];
    static DEFAULT_HEADERS: string[];
    constructor(allowedOrigins: string[], allowedMethods: HTTPMethods[], allowedHeaders?: string[]);
    /**
     * @description checks if the request is from an allowed origin.
     * @param event - The API Gateway event.
     * @returns true if the request is from an allowed origin, false otherwise.
     */
    isValid(event: APIGatewayEvent): boolean;
    isInvalid(event: APIGatewayEvent): boolean;
    buildHeaders(event: APIGatewayEvent): Record<string, string>;
}
