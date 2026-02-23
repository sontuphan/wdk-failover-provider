// Copyright 2024 Tether Operations Limited
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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
export default class FailoverProvider {
  /**
   * @private
   * @type {number} The current active provider index.
   */
  _activeProvider = 0

  /**
   * @private
   * @type {Array<ProviderProxy<T>>} The list of provider candidates.
   */
  _providers = []

  /**
   * @private
   * @type {number} The number of retries before the failover provider throws an error.
   */
  _retries

  /**
   * @private
   * @type {(error: unknown) => boolean} Define errors that the failover provider should retry.
   */
  _shouldRetryOn

  /**
   * @param {FailoverProviderConfig} config - The failover factory config.
   */
  constructor ({ retries = 3, shouldRetryOn = (error) => error instanceof Error } = {}) {
    this._retries = retries
    this._shouldRetryOn = shouldRetryOn
  }

  /**
   * Add a provider into the list of candidates
   * @template {T} P
   * @param {P} provider Provider
   * @returns {FailoverProvider} The instance of FailoverProvider
   */
  addProvider = (provider) => {
    this._providers.push({ provider, ms: 0 })
    return this
  }

  /**
   * The FailoverProvider factory
   * @returns {T} The instance of FailoverProvider
   * @throws {Error} When no providers have been added via addProvider()
   */
  initialize = () => {
    if (!this._providers.length) {
      throw new Error(
        'Cannot initialize an empty provider. Call `addProvider` before this function.'
      )
    }

    const [{ provider }] = this._providers

    return new Proxy(provider, {
      get: (_, p, receiver) => {
        return this._proxy(this._providers[this._activeProvider], p, receiver)
      }
    })
  }

  /**
   * Switch to the next candidate provider by round robin
   * @private
   * @returns {ProviderProxy<T>} The new candidate provider
   */
  _switch = () => {
    this._activeProvider = (this._activeProvider + 1) % this._providers.length
    return this._providers[this._activeProvider]
  }

  /**
   * Store the response time of the latest request
   * @private
   * @param {ProviderProxy<T>} target - The provider proxy
   * @returns {() => void} The benchmark close function
   */
  _benchmark = (target) => {
    const start = Date.now()
    return () => {
      target.ms = Math.round(Date.now() - start)
    }
  }

  /**
   * Proxy handler will keep retry until a response or throw the latest error.
   * @private
   * @param {ProviderProxy<T>} target The current active provider
   * @param {string | symbol} p The method/property name
   * @param {any} receiver The JS Proxy
   * @param {number} retries The number of retries
   * @returns {(string extends keyof T ? T[keyof T & string] : any) | (symbol extends keyof T ? T[keyof T & symbol] : any) | ((...args: any[]) => any | Promise<any>)}
   */
  _proxy = (target, p, receiver, retries = this._retries) => {
    // Immediately return if the property is not a function
    const prop = Reflect.get(target.provider, p, receiver)
    if (typeof prop !== 'function') return prop

    /**
     * @param {...any} args
     * @returns {any | Promise<any>}
     */
    return (...args) => {
      const record = this._benchmark(target)

      /**
       * @type {any | Promise<any>}
       */
      let re

      // Retry on sync functions
      try {
        re = prop.apply(target.provider, args)
        if (!re?.then) {
          record()
          return re
        }
      } catch (er) {
        record()
        if (retries <= 0 || !this._shouldRetryOn(er)) throw er
        const property = this._proxy(this._switch(), p, receiver, retries - 1)
        if (typeof property === 'function') return property.apply(this, args)
        return property
      }

      // Retry on async functions
      return re
        .then(
          /**
           * @param {any} re
           */
          (re) => {
            record()
            return re
          }
        )
        .catch(
          /**
           * @param {unknown} er
           */
          (er) => {
            record()
            if (retries <= 0 || !this._shouldRetryOn(er)) throw er
            const property = this._proxy(this._switch(), p, receiver, retries - 1)
            if (typeof property === 'function') return property.apply(this, args)
            return property
          }
        )
    }
  }
}
