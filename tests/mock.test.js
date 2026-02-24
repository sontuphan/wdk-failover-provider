import { describe } from 'noba'
import FailoverProvider from '@tetherto/wdk-failover-provider'

class Animal {
  /**
   * @constructor
   * @param {string} name
   * @param {string} [sound]
   * @param {number} [pace]
   */
  constructor(name, sound = '...', pace = 300) {
    /**
     * @type {string}
     */
    this.name = name

    /**
     * @type {string}
     */
    this.sound = sound

    /**
     * @type {number}
     */
    this.pace = pace
  }

  syncSpeak = () => {
    return this.sound
  }

  speak = async () => {
    await new Promise((r) => setTimeout(r, this.pace))
    return this.sound
  }
}

describe('Mocked providers', ({ describe }) => {
  class Cat extends Animal {
    constructor() {
      super('Cat', 'meow')
    }
  }

  class Dog extends Animal {
    constructor() {
      super('Dog', 'woof')
    }
  }

  class Cockroach extends Animal {
    constructor() {
      super('Cockroach')
    }

    speak = async () => {
      throw new Error("A cockroach doesn't speak, it flies")
    }

    syncSpeak = () => {
      throw new Error("A cockroach doesn't speak, it flies")
    }
  }

  describe('properties of providers', ({ test }) => {
    test('should access the property', async ({ expect }) => {
      /**
       * @type {FailoverProvider<Animal>}
       */
      const animal = new FailoverProvider()
        .addProvider(new Cat())
        .addProvider(new Dog())
        .initialize()

      expect(animal.name).to.be('Cat')
    })
  })

  describe('sync providers', ({ describe, test }) => {
    test('should accept polymorphism', async ({ expect }) => {
      /**
       * @type {FailoverProvider<Animal>}
       */
      const animal = new FailoverProvider()
        .addProvider(new Cat())
        .addProvider(new Dog())
        .initialize()

      const spoke = animal.syncSpeak()
      expect(spoke).to.be('meow')
    })

    test('should switch provider', async ({ expect }) => {
      /**
       * @type {FailoverProvider<Animal>}
       */
      const animal = new FailoverProvider()
        .addProvider(new Cockroach())
        .addProvider(new Dog())
        .addProvider(new Cat())
        .initialize()

      const spoke = animal.syncSpeak()
      expect(spoke).to.be('woof')
    })

    test('should retry 1 times and fail', async ({ expect }) => {
      /**
       * @type {FailoverProvider<Animal>}
       */
      const animal = new FailoverProvider({ retries: 1 })
        .addProvider(new Cockroach())
        .addProvider(new Cockroach())
        .addProvider(new Cat())
        .addProvider(new Dog())
        .initialize()

      expect(() => {
        animal.syncSpeak()
      }).throws("doesn't speak")
    })

    describe('shouldRetryOn config', ({ test }) => {
      test('should not retry on custom shouldRetryOn', async ({ expect }) => {
        /**
         * @type {FailoverProvider<Animal>}
         */
        const animal = new FailoverProvider({
          shouldRetryOn: (error) => {
            if (error instanceof Error) {
              return !/cockroach/.test(error.message)
            }
            return true
          },
        })
          .addProvider(new Cockroach())
          .addProvider(new Cat())
          .addProvider(new Dog())
          .initialize()

        expect(() => {
          animal.syncSpeak()
        }).throws("doesn't speak")
      })

      test('should retry on the default shouldRetryOn', async ({ expect }) => {
        /**
         * @type {FailoverProvider<Animal>}
         */
        const animal = new FailoverProvider()
          .addProvider(new Cockroach())
          .addProvider(new Cat())
          .addProvider(new Dog())
          .initialize()

        const spoken = animal.syncSpeak()
        expect(spoken).to.be('meow')
      })
    })
  })

  describe('async providers', ({ describe, test }) => {
    test('should accept polymorphism', async ({ expect }) => {
      /**
       * @type {FailoverProvider<Animal>}
       */
      const animal = new FailoverProvider()
        .addProvider(new Cat())
        .addProvider(new Dog())
        .initialize()

      const spoke = await animal.speak()
      expect(spoke).to.be('meow')
    })

    test('should switch provider', async ({ expect }) => {
      /**
       * @type {FailoverProvider<Animal>}
       */
      const animal = new FailoverProvider()
        .addProvider(new Cockroach())
        .addProvider(new Dog())
        .addProvider(new Cat())
        .initialize()

      const spoke = await animal.speak()
      expect(spoke).to.be('woof')
    })

    test('should retry 1 times and fail', async ({ expect }) => {
      /**
       * @type {FailoverProvider<Animal>}
       */
      const animal = new FailoverProvider({ retries: 1 })
        .addProvider(new Cockroach())
        .addProvider(new Cockroach())
        .addProvider(new Cat())
        .addProvider(new Dog())
        .initialize()

      expect(async () => {
        await animal.speak()
      }).rejects("doesn't speak")
    })

    describe('shouldRetryOn config', ({ test }) => {
      test('should not retry on custom shouldRetryOn', async ({ expect }) => {
        /**
         * @type {FailoverProvider<Animal>}
         */
        const animal = new FailoverProvider({
          shouldRetryOn: (error) => {
            if (error instanceof Error) {
              return !/cockroach/.test(error.message)
            }
            return true
          },
        })
          .addProvider(new Cockroach())
          .addProvider(new Cat())
          .addProvider(new Dog())
          .initialize()

        expect(async () => {
          await animal.speak()
        }).rejects("doesn't speak")
      })

      test('should retry on the default shouldRetryOn', async ({ expect }) => {
        /**
         * @type {FailoverProvider<Animal>}
         */
        const animal = new FailoverProvider()
          .addProvider(new Cockroach())
          .addProvider(new Cat())
          .addProvider(new Dog())
          .initialize()

        const spoken = await animal.speak()
        expect(spoken).to.be('meow')
      })
    })
  })
})
