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
exports.SecretsManager = void 0;
const client_secrets_manager_1 = require("@aws-sdk/client-secrets-manager");
const logger_1 = require("../logger");
const validate_1 = require("../validate");
const index_1 = require("../index");
const cache_1 = require("../cache");
const secretsManagerClient = new client_secrets_manager_1.SecretsManagerClient({});
/**
 * @description A helper class to retrieve a secret from AWS Secrets Manager based on stages. It ensures that the standard format for the secret is correct.
 */
class SecretsManager {
    /**
     *
     * @description Retrieves the secret from AWS Secrets Manager and ensures the key follows the format `/app/stage/secretName`. In case there is an extra parameter you should pass it via the `secretName` property. ei. `secretName1/secretName2` resulting in `/app/stage/secretName1/secretName2`
     *
     * @param app The app that you are retrieving the secret for.
     * @param secretName The name of the secret that you are retrieving.
     * @param options Optional parameters to manipulate the output response.
     */
    static getSecret(app, secretName, options) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            logger_1.Logger.internal.verbose('SecretsManager.getSecret');
            const stage = (_a = options === null || options === void 0 ? void 0 : options.stage) !== null && _a !== void 0 ? _a : (0, index_1.getEnvironmentVariable)('STAGE');
            const name = SecretsManager.buildSecretName(app, stage, secretName);
            const cacheKey = `secrets:${name}`;
            // Check cache if enabled (default: true)
            if ((options === null || options === void 0 ? void 0 : options.cache) !== false) {
                const cachedValue = cache_1.ParameterCache.get(cacheKey);
                if (cachedValue !== null) {
                    logger_1.Logger.internal.verbose('Returning cached secret');
                    return SecretsManager.processValue(cachedValue, options);
                }
            }
            logger_1.Logger.internal.verbose('Creating GetSecretValueCommand');
            const command = new client_secrets_manager_1.GetSecretValueCommand({
                SecretId: name,
            });
            logger_1.Logger.internal.debug(command);
            logger_1.Logger.internal.verbose('Calling Secrets Manager');
            const response = yield secretsManagerClient.send(command).catch(err => {
                logger_1.Logger.internal.awsError(err);
                throw err;
            });
            logger_1.Logger.internal.verbose('Checking if response has SecretString');
            if (!(response === null || response === void 0 ? void 0 : response.SecretString)) {
                const message = `Response from Secrets Manager Client doesn't have SecretString or is null. Received: ${JSON.stringify(response)}`;
                logger_1.Logger.internal.error(500, message);
                throw new Error(message);
            }
            logger_1.Logger.internal.verbose('Getting "SecretString" from response object');
            const value = response.SecretString;
            // Store in cache if enabled (default: true)
            if ((options === null || options === void 0 ? void 0 : options.cache) !== false) {
                cache_1.ParameterCache.set(cacheKey, value, options === null || options === void 0 ? void 0 : options.cacheTtl);
                logger_1.Logger.internal.verbose('Secret cached');
            }
            return SecretsManager.processValue(value, options);
        });
    }
    static createSecret(app, secretName, value, key, options) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            logger_1.Logger.internal.verbose('SecretsManager.createSecret');
            const stage = (_a = options === null || options === void 0 ? void 0 : options.stage) !== null && _a !== void 0 ? _a : (0, index_1.getEnvironmentVariable)('STAGE');
            const name = SecretsManager.buildSecretName(app, stage, secretName);
            logger_1.Logger.internal.verbose('Checking if value is not a string');
            if (typeof value !== 'string') {
                logger_1.Logger.internal.verbose('Converting value to a string');
                value = JSON.stringify(value);
            }
            logger_1.Logger.internal.verbose('Checks if convertToBase64 was passed');
            if (options === null || options === void 0 ? void 0 : options.convertToBase64) {
                logger_1.Logger.internal.verbose('Trying to convert to base64');
                try {
                    value = Buffer.from(value).toString('base64');
                }
                catch (err) {
                    logger_1.Logger.internal.error(500, err);
                    throw err;
                }
            }
            // Check if secret already exists
            if (!(options === null || options === void 0 ? void 0 : options.overwrite)) {
                try {
                    logger_1.Logger.internal.verbose('Checking if secret already exists');
                    const getCommand = new client_secrets_manager_1.GetSecretValueCommand({
                        SecretId: name,
                    });
                    yield secretsManagerClient.send(getCommand);
                    // If we get here, the secret exists
                    const message = 'The secret already exists';
                    logger_1.Logger.internal.error(400, message);
                    throw new Error(message);
                }
                catch (err) {
                    // If the error is ResourceNotFoundException, the secret doesn't exist, which is what we want
                    if (err.name !== 'ResourceNotFoundException') {
                        throw err;
                    }
                }
            }
            logger_1.Logger.internal.verbose('Creating CreateSecretCommand');
            const command = new client_secrets_manager_1.CreateSecretCommand({
                Name: name,
                SecretString: value,
                KmsKeyId: key,
            });
            logger_1.Logger.internal.debug(command);
            logger_1.Logger.internal.verbose('Calling Secrets Manager');
            try {
                yield secretsManagerClient.send(command);
            }
            catch (err) {
                // If the secret already exists and overwrite is true, update it instead
                if (err.name === 'ResourceExistsException' && (options === null || options === void 0 ? void 0 : options.overwrite)) {
                    logger_1.Logger.internal.verbose('Secret already exists, updating it instead');
                    const updateCommand = new client_secrets_manager_1.UpdateSecretCommand({
                        SecretId: name,
                        SecretString: value,
                        KmsKeyId: key,
                    });
                    yield secretsManagerClient.send(updateCommand).catch(updateErr => {
                        logger_1.Logger.internal.awsError(updateErr);
                        throw updateErr;
                    });
                }
                else {
                    logger_1.Logger.internal.awsError(err);
                    throw err;
                }
            }
            // Invalidate cache after successful create/update
            if ((options === null || options === void 0 ? void 0 : options.cache) !== false) {
                const cacheKey = `secrets:${name}`;
                cache_1.ParameterCache.clear(cacheKey);
                logger_1.Logger.internal.verbose('Secret cache invalidated after create/update');
            }
        });
    }
    static listSecrets(app, secretName, options) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            logger_1.Logger.internal.verbose('SecretsManager.listSecrets');
            const stage = (_a = options === null || options === void 0 ? void 0 : options.stage) !== null && _a !== void 0 ? _a : (0, index_1.getEnvironmentVariable)('STAGE');
            const name = SecretsManager.buildSecretName(app, stage, secretName);
            logger_1.Logger.internal.verbose('Creating ListSecretsCommand');
            const command = new client_secrets_manager_1.ListSecretsCommand({
                Filters: [
                    {
                        Key: 'name',
                        Values: [name],
                    },
                ],
            });
            logger_1.Logger.internal.debug(command);
            logger_1.Logger.internal.verbose('Calling Secrets Manager');
            const result = yield secretsManagerClient.send(command).catch(err => {
                logger_1.Logger.internal.awsError(err);
                throw err;
            });
            const secrets = {};
            if (result === null || result === void 0 ? void 0 : result.SecretList) {
                for (const secret of result.SecretList) {
                    const childPath = (_b = secret === null || secret === void 0 ? void 0 : secret.Name) === null || _b === void 0 ? void 0 : _b.split(`${name}/`)[1];
                    if (childPath) {
                        secrets[childPath] = secret === null || secret === void 0 ? void 0 : secret.Name;
                    }
                }
            }
            logger_1.Logger.internal.debug(secrets);
            return secrets;
        });
    }
    static deleteSecret(app, secretName, options) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            logger_1.Logger.internal.verbose('SecretsManager.deleteSecret');
            const stage = (_a = options === null || options === void 0 ? void 0 : options.stage) !== null && _a !== void 0 ? _a : (0, index_1.getEnvironmentVariable)('STAGE');
            const name = SecretsManager.buildSecretName(app, stage, secretName);
            logger_1.Logger.internal.verbose('Creating DeleteSecretCommand');
            const command = new client_secrets_manager_1.DeleteSecretCommand({
                SecretId: name,
                ForceDeleteWithoutRecovery: true,
            });
            logger_1.Logger.internal.debug(command);
            logger_1.Logger.internal.verbose('Calling Secrets Manager');
            yield secretsManagerClient.send(command).catch(err => {
                logger_1.Logger.internal.awsError(err);
                throw err;
            });
            // Invalidate cache after successful deletion
            if ((options === null || options === void 0 ? void 0 : options.cache) !== false) {
                const cacheKey = `secrets:${name}`;
                cache_1.ParameterCache.clear(cacheKey);
                logger_1.Logger.internal.verbose('Secret cache invalidated after deletion');
            }
        });
    }
    /**
     * Process secret value with parsing options
     * @private
     */
    static processValue(value, options) {
        logger_1.Logger.internal.verbose('Processing secret value');
        logger_1.Logger.internal.verbose('Checking if parseBase64 was passed');
        if (options === null || options === void 0 ? void 0 : options.parseBase64) {
            logger_1.Logger.internal.verbose('Trying to convert base64 to ascii string');
            try {
                value = Buffer.from(value, 'base64').toString();
            }
            catch (e) {
                logger_1.Logger.internal.warning(`Failed to parse response as Base64! returning raw response instead! Reason for failure was ${JSON.stringify(e)}`);
            }
        }
        logger_1.Logger.internal.verbose('Checking if parseJson was passed');
        if (options === null || options === void 0 ? void 0 : options.parseJson) {
            logger_1.Logger.internal.verbose('Trying to parse response as JSON!');
            try {
                return JSON.parse(value);
            }
            catch (e) {
                logger_1.Logger.internal.warning(`Failed to parse response as JSON! Return raw response instead! Reason for failure was ${JSON.stringify(e)}`);
                return value;
            }
        }
        return value;
    }
    static buildSecretName(app, stage, secretName) {
        logger_1.Logger.internal.verbose('Validating that the arguments received are strings');
        validate_1.Validate.string(app, 'app');
        validate_1.Validate.string(stage, 'stage');
        validate_1.Validate.string(secretName, 'secretName');
        logger_1.Logger.internal.verbose('Ensuring that the argument "secretName" does not start with a "/"');
        if (secretName.startsWith('/')) {
            logger_1.Logger.internal.error(400, 'Argument "secretName" must not start with a "/".');
        }
        logger_1.Logger.internal.verbose('Creating Secrets Manager secret name string');
        const name = `/${app}/${stage}/${secretName}`;
        logger_1.Logger.internal.debug(`Secret name passed ${name}`);
        return name;
    }
}
exports.SecretsManager = SecretsManager;
