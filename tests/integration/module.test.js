import FailoverProvider from '@tetherto/wdk-failover-provider'

import { JsonRpcProvider, BrowserProvider, parseEther, Wallet, ZeroAddress } from 'ethers'

import { describe, expect, test } from '@jest/globals'

/**
 * @typedef {import("ethers").AbstractProvider} AbstractProvider
 */

const window = {
  ethereum: {
    request: async ({ method }) => {
      if (method === 'eth_chainId') return 1
      throw new Error('Provider disconnected')
    },
  },
}

const RPC_PROVIDER = process.env.RPC_URL ?? 'https://ethereum-rpc.publicnode.com'

describe('@tetherto/wdk-failover-provider', () => {
  test('should accept polymorphism', async () => {
    /**
     * @type {AbstractProvider}
     */
    const provider = new FailoverProvider()
      .addProvider(new BrowserProvider(window.ethereum))
      .addProvider(new JsonRpcProvider(RPC_PROVIDER, { name: 'mainnet', chainId: 1 }))
      .initialize()

    const blockNumber = await provider.getBlockNumber()

    expect(blockNumber > 0).toBe(true)
  })

  test('should switch provider', async () => {
    /**
     * @type {AbstractProvider}
     */
    const provider = new FailoverProvider()
      .addProvider(new BrowserProvider(window.ethereum))
      .addProvider(new BrowserProvider(window.ethereum))
      .addProvider(new JsonRpcProvider(RPC_PROVIDER, { name: 'mainnet', chainId: 1 }))
      .initialize()

    const blockNumber = await provider.getBlockNumber()

    expect(blockNumber > 0).toBe(true)
  })

  describe('shouldRetryOn config', () => {
    test('should not retry on insufficient balance error', async () => {
      /**
       * @type {AbstractProvider}
       */
      const provider = new FailoverProvider({
        shouldRetryOn: (error) => {
          const isInsufficientFunds = error?.code === 'INSUFFICIENT_FUNDS' || /OutOfFunds/.test(error?.info?.error?.message)
          return !isInsufficientFunds
        },
      })
        .addProvider(new JsonRpcProvider(RPC_PROVIDER, { name: 'mainnet', chainId: 1 }))
        .addProvider(new BrowserProvider(window.ethereum))
        .initialize()

      const wallet = Wallet.createRandom(provider)

      await expect(async () => {
        await wallet.sendTransaction({
          to: ZeroAddress,
          value: parseEther('1'),
        })
      }).rejects.toThrow(/insufficient funds|missing revert data/)
    })

    test('should be failed on the default shouldRetryOn', async () => {
      /**
       * @type {AbstractProvider}
       */
      const provider = new FailoverProvider({ retries: 1 })
        .addProvider(new JsonRpcProvider(RPC_PROVIDER, { name: 'mainnet', chainId: 1 }))
        .addProvider(new BrowserProvider(window.ethereum))
        .initialize()

      const wallet = Wallet.createRandom(provider)

      await expect(async () => {
        await wallet.sendTransaction({
          to: ZeroAddress,
          value: parseEther('1'),
        })
      }).rejects.toThrow(/missing revert data/)
    })
  })
})
