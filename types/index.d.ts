/**
 * @typedef {Object} FailoverProviderConfig
 * @property {number} [retries] - The number of additional retry attempts after the initial call fails. Total attempts = `1 + retries`. For example, `retries: 3` with 4 providers will try each provider once before throwing.
 * @property {(error: unknown) => boolean} [shouldRetryOn] - Define errors that the failover provider should retry. Default: `(error: unknown) => error instanceof Error`.
 */
/**
 * @template T
 * @typedef {Object} ProviderProxy<T>
 * @property {T} provider - The provider abstraction.
 * @property {number} ms - The last response duration, for future provider ranking.
 */
/**
 * @class
 * @template {{}} T Because limitation of jsdoc, we use `T extends {}` instead of `T extends object`.
 * @type {FailoverProvider<T>} The failover factory
 */
export default class FailoverProvider<T extends {}> {
    /**
     * @param {FailoverProviderConfig} config - The failover factory config.
     */
    constructor({ retries, shouldRetryOn }?: FailoverProviderConfig);
    /**
     * @private
     * @type {number} The current active provider index.
     */
    private _activeProvider;
    /**
     * @private
     * @type {Array<ProviderProxy<T>>} The list of provider candidates.
     */
    private _providers;
    /**
     * @private
     * @type {number} The number of retries before the failover provider throws an error.
     */
    private _retries;
    /**
     * @private
     * @type {(error: unknown) => boolean} Define errors that the failover provider should retry.
     */
    private _shouldRetryOn;
    /**
     * Add a provider into the list of candidates
     * @template {T} P
     * @param {P} provider Provider
     * @returns The instance of FailoverProvider
     */
    addProvider: <P extends T>(provider: P) => this;
    /**
     * The FailoverProvider factory
     * @returns The instance of FailoverProvider
     */
    initialize: () => T;
    /**
     * Switch to the next candidate provider by round robin
     * @private
     * @returns The new candidate provider
     */
    private _switch;
    /**
     * Store the response time of the latest request
     * @private
     * @param {ProviderProxy<T>} target - The provider proxy
     * @returns {() => void} The benchmark close function
     */
    private _benchmark;
    /**
     * Proxy handler will keep retry until a response or throw the latest error.
     * @private
     * @param {ProviderProxy<T>} target The current active provider
     * @param {string | symbol} p The method/property name
     * @param {any} receiver The JS Proxy
     * @param {number} retries The number of retries
     * @returns {(string extends keyof T ? T[keyof T & string] : any) | (symbol extends keyof T ? T[keyof T & symbol] : any) | ((...args: any[]) => any | Promise<any>)}
     */
    private _proxy;
}
export type FailoverProviderConfig = {
    /**
     * - The number of additional retry attempts after the initial call fails. Total attempts = `1 + retries`. For example, `retries: 3` with 4 providers will try each provider once before throwing.
     */
    retries?: number;
    /**
     * - Define errors that the failover provider should retry. Default: `(error: unknown) => error instanceof Error`.
     */
    shouldRetryOn?: (error: unknown) => boolean;
};
/**
 * <T>
 */
export type ProviderProxy<T> = {
    /**
     * - The provider abstraction.
     */
    provider: T;
    /**
     * - The last response duration, for future provider ranking.
     */
    ms: number;
};
