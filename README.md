# WDK Failover Provider

Zero-dependency failover mechanism for seamless fallback when providers break.

## Install

Install from npm:

```bash
npm install @tetherto/wdk-failover-provider
```

## Quick Start

```ts
import FailoverProvider from '@tetherto/wdk-failover-provider'
import { AbstractProvider, JsonRpcProvider, BrowserProvider } from 'ethers'

const RPC_PROVIDER = 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY'

// Create a failover provider that will try the BrowserProvider first,
// then fallback to a JSON-RPC provider on errors.
const provider = new FailoverProvider<AbstractProvider>()
  .addProvider(new BrowserProvider(window.ethereum))
  .addProvider(new JsonRpcProvider(RPC_PROVIDER))
  .initialize()

// Calls are proxied and will failover according to the configured retries
;(async () => {
  const blockNumber = await provider.getBlockNumber()
  console.log('block number', blockNumber)
})()
```

## API

This package exposes a single default export: the `FailoverProvider` factory.

- `new FailoverProvider(config?)` — Create a factory.
  - `config.retries` (number, default `3`): number of retry attempts before throwing the last error.
  - `config.shouldRetryOn` (function, default: `error => error instanceof Error`): predicate to determine whether to retry on a given error.

- `instance.addProvider(provider)` — Add a provider candidate. `provider` can be any object (sync or async methods).

- `instance.initialize()` — Return a proxied provider. Calls to methods are intercepted and automatically retried/failover according to the configuration.

Behavior notes:

- The returned proxied provider forwards non-function properties from the currently active provider.
- When a method throws exceptions and `shouldRetryOn(error)` returns `true`, the proxy switches to the next provider (round-robin) and retries until retries are exhausted.

## License

Apache-2.0
