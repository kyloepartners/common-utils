import { APIGatewayEvent, Responses } from './api';
import { Callback, Context } from 'aws-lambda';
export type ErrorHandler<TError = any> = (error: TError) => Promise<Responses> | Responses;
export type EnvironmentVariableName = 'STAGE' | 'DEBUG' | 'VERBOSE' | 'INTERNAL' | 'SENSITIVE' | 'REGION' | 'LOCALHOST_PORT' | string;
export declare function getEnvironmentVariable(name: EnvironmentVariableName): string | boolean | number | undefined;
type Handler<TEvent = any, TResult = any> = (event: TEvent, context: Context, callback?: Callback<TResult>) => Promise<TResult> | TResult;
export type LambdaEvent<TEvent = any> = TEvent | APIGatewayEvent;
type LambdaHandler<TEvent = LambdaEvent> = Handler<TEvent, Responses>;
/**
 * @description Checks for the Warm-Up flag and ensures the function is only called if it not a warm-up call. It also handles any unexpect error.
 *
 * ```typescript
 * module.exports.handler = createLambda(async (event) => {
 *  ... Lambda Code ...
 * });
 * ```
 */
export declare function createLambda<TEvent = any, TOutput = Responses>(handler: LambdaHandler<TEvent>, onError?: ErrorHandler, transformer?: (responses: Responses, event: LambdaEvent<TEvent>, context: Context) => Responses): LambdaHandler<TEvent>;
export {};
