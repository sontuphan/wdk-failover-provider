import { describe } from 'noba'
import FailoverProvider from '@tetherto/wdk-failover-provider'
import { shims } from './config.js'

/**
 * @typedef {import("ethers").AbstractProvider} AbstractProvider
 */

const { JsonRpcProvider, BrowserProvider, parseEther, Wallet, ZeroAddress } = await import(
  'ethers',
  {
    with: shims,
  }
)

const window = {
  ethereum: {
    request:
      /**
       *
       * @param {{method: string, params?: unknown[] | object}} params
       * @returns
       */
      async ({ method }) => {
        if (method === 'eth_chainId') return 1
        throw new Error('Provider disconnected')
      },
  },
}

const RPC_PROVIDER = 'https://mainnet.infura.io/v3/06da09cda4da458c9aafe71cf464f5e5'

describe('Ethereum providers', ({ describe, test }) => {
  test('should accept polymorphism', async ({ expect }) => {
    /**
     * @type {FailoverProvider<AbstractProvider>}
     */
    const provider = new FailoverProvider()
      .addProvider(new BrowserProvider(window.ethereum))
      .addProvider(new JsonRpcProvider(RPC_PROVIDER))
      .initialize()

    const blockNumber = await provider.getBlockNumber()

    expect(blockNumber > 0).to.be(true)
  })

  test('should retry 1 time and fail', async ({ expect }) => {
    /**
     * @type {FailoverProvider<AbstractProvider>}
     */
    const provider = new FailoverProvider()
      .addProvider(new BrowserProvider(window.ethereum))
      .addProvider(new BrowserProvider(window.ethereum))
      .addProvider(
        new JsonRpcProvider(RPC_PROVIDER, {
          name: 'mainnet',
          chainId: 1,
        }),
      )
      .initialize()

    const blockNumber = await provider.getBlockNumber()

    expect(blockNumber > 0).to.be(true)
  })

  describe('shouldRetryOn config', ({ test }) => {
    test('should not retry on insufficient balance error', async ({ expect }) => {
      /**
       * @type {FailoverProvider<AbstractProvider>}
       */
      const provider = new FailoverProvider({
        shouldRetryOn: (error) => {
          if (error instanceof Error && 'code' in error) {
            return error.code !== 'INSUFFICIENT_FUNDS'
          }
          return true
        },
      })
        .addProvider(
          new JsonRpcProvider(RPC_PROVIDER, {
            name: 'mainnet',
            chainId: 1,
          }),
        )
        .addProvider(new BrowserProvider(window.ethereum))
        .initialize()

      const wallet = Wallet.createRandom(provider)

      expect(async () => {
        await wallet.sendTransaction({
          to: ZeroAddress,
          value: parseEther('1'),
        })
      }).rejects(/insufficient funds/)
    })

    test('should be failed on the default shouldRetryOn', async ({ expect }) => {
      /**
       * @type {FailoverProvider<AbstractProvider>}
       */
      const provider = new FailoverProvider({
        retries: 1,
      })
        .addProvider(
          new JsonRpcProvider(RPC_PROVIDER, {
            name: 'mainnet',
            chainId: 1,
          }),
        )
        .addProvider(new BrowserProvider(window.ethereum))
        .initialize()

      const wallet = Wallet.createRandom(provider)

      expect(async () => {
        await wallet.sendTransaction({
          to: ZeroAddress,
          value: parseEther('1'),
        })
      }).rejects(/missing revert data/)
    })
  })
})
