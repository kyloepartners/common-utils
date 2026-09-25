export type AiInput = {
    kind: 'text';
    text: string;
} | {
    kind: 'file';
    s3Key: string;
} | {
    kind: 'file';
    bytes: string;
    format: string;
};
export interface AiInvokeRequest {
    featureType: string;
    inputs: AiInput[];
    responseMode: 'text' | 'json';
    callingApp?: string;
    correlationId?: string;
}
export type AiInvokeResponse = {
    ok: true;
    mode: 'text';
    text: string;
    attempts: 1;
} | {
    ok: true;
    mode: 'json';
    data: unknown;
    attempts: number;
} | {
    ok: false;
    retryable: boolean;
    code: 'config_error' | 'model_error' | 'validation_failed';
    message: string;
    validationErrors?: object[];
};
/**
 * @description Invokes the `cad-ai` platform service (KCON-971) to resolve a registered
 * feature's model/prompt/schema and run it against Amazon Bedrock. `cad-ai` has no HTTP
 * front door - it is invoked only via `lambda:InvokeFunction`, so the caller's own Lambda
 * execution role must be granted `lambda:InvokeFunction` on `cad-ai-${stage}-invoke`.
 */
declare class AIBase {
    private lambdaClient;
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
    invoke(request: AiInvokeRequest): Promise<AiInvokeResponse>;
}
export declare const AI: AIBase;
export {};
