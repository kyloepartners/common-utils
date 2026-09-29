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
exports.AI = void 0;
const client_lambda_1 = require("@aws-sdk/client-lambda");
const index_1 = require("../index");
/**
 * @description Invokes the `cad-ai` platform service (KCON-971) to resolve a registered
 * feature's model/prompt/schema and run it against Amazon Bedrock. `cad-ai` has no HTTP
 * front door - it is invoked only via `lambda:InvokeFunction`, so the caller's own Lambda
 * execution role must be granted `lambda:InvokeFunction` on `cad-ai-${stage}-invoke`.
 */
class AIBase {
    constructor() {
        this.lambdaClient = new client_lambda_1.LambdaClient({});
    }
    /**
     * @description Invokes a registered `cad-ai` feature synchronously.
     *
     * ```typescript
     * import {AI} from 'common-utils/ai';
     *
     * const response = await AI.invoke({
     *   featureType: 'candidate-parse-cv',
     *   inputs: [{kind: 'file', s3Key: cvS3Key}],
     *   responseMode: 'json',
     *   callingApp: 'ob',
     *   correlationId: String(candidateId),
     * });
     * ```
     *
     * @param request The feature type, inputs and response mode to invoke `cad-ai` with.
     */
    invoke(request) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const stage = (0, index_1.getEnvironmentVariable)('STAGE');
            const result = yield this.lambdaClient.send(new client_lambda_1.InvokeCommand({
                FunctionName: `cad-ai-${stage}-invoke`,
                InvocationType: 'RequestResponse',
                Payload: JSON.stringify(request),
            }));
            // invoke.ts is built with createLambda/Responses (this codebase's convention for every
            // Lambda, invoked directly or not), so the raw payload is a Responses envelope -
            // {statusCode, headers, body: JSON.stringify({message, data})} - not the AiInvokeResponse
            // itself. The real response is nested inside body.data.
            const envelope = JSON.parse((_b = (_a = result.Payload) === null || _a === void 0 ? void 0 : _a.transformToString()) !== null && _b !== void 0 ? _b : '{}');
            const parsedBody = typeof envelope.body === 'string' ? JSON.parse(envelope.body) : envelope;
            return parsedBody.data;
        });
    }
}
exports.AI = new AIBase();
