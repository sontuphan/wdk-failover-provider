/**
 * @typedef {Object} FailoverProviderConfig
 * @property {number} [retries] - The number of retries in the failover mechanism.
 */
/**
 * @template T
 * @typedef {Object} ProviderProxy<T>
 * @property {T} provider - The provider abstraction.
 * @property {number} ms - The last response duration, which is planned for quorum mechanism.
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
    constructor({ retries }?: FailoverProviderConfig);
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
     * @returns The benchmark close function
     */
    private _benchmark;
    /**
     * Proxy handler will keep retry until a response or throw the latest error.
     * @private
     * @param {ProviderProxy<T>} target The current active provider
     * @param {string | symbol} p The method name
     * @param {any} receiver The JS Proxy
     * @param {number} retries The number of retries
     * @returns
     */
    private proxy;
}
export type FailoverProviderConfig = {
    /**
     * - The number of retries in the failover mechanism.
     */
    retries?: number;
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
     * - The last response duration, which is planned for quorum mechanism.
     */
    ms: number;
};
