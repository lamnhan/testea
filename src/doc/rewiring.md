
Load modules or services with mocked dependencies.

A rewiring dependency is resolved by an `ID`, depending on the kind of a module:

- **Native**: the `id` is the same as the `name`: `path`, `os`, ...
- **Installed**: the `id` is the dependency name prefixed by a `~`:
  - `~lodash` -> **./node_modules/lodash**
  - `~@xxx/abc` -> **./node_modules/xxx/abc**
- **Local**: the `id` is prefixed by a `@`:
  - `@src/xxx/abc` -> **./src/xxx/abc**
  - Or `@xxx/abc` -> **./src/xxx/abc**

## `rewiremock`

This package also exports a [`rewiremock`](https://github.com/theKashey/rewiremock) instance, so that you may rewire modules with the official interface. See more at: <https://github.com/theKashey/rewiremock>

## [`rewireModule(input, mockedModules)`](https://lamnhan.com/testing/index.html#rewiremodule)

Load a module with mocked dependencies.

```ts
// rewire the 'module1'
const module1Rewiring = rewireModule(
  // load the original module
  '@src/module1',
  // (optional) replace dependencies with mocked instances
  {
    'path': {},
    '~lodash': {},
    '@xxx/abc': {},
  }
);

// start test
it('ok', async () => {
  // retrieve the rewired module
  const rewiredModule1 = await module1Rewiring.getModule();

  // test a method
  const result = rewiredModule1.someMethod();
  expect(result).equal('xxx');
});
```

### The [`ModuleRewiring`](https://lamnhan.com/testing/classes/modulerewiring.html)

[`ModuleRewiring`](https://lamnhan.com/testing/classes/modulerewiring.html) is the constructor of `rewireModule`, see `rewireModule` for the list of parameters.

| Method | Returns type | Description |
| --- | --- | --- |
| `getModule()` | `Promise<object>` | Get the rewired module |
| `getService(name)` | `Promise<class>` | Get a service constructor of the mocked module |
| `getMockedModules()` | `object` | Get all mocked dependencies |
| `getResult()` | `Promise<object>` | Get all data |

## [`rewireService(serviceConstructor, mockedServices, withStubs)`](https://lamnhan.com/testing/index.html#rewireservice)

Load a service with mocked dependencies and stubing methods.

```ts
import { MyService } from 'module1';

const myServiceRewiring = rewireService(
  // the original or a mocked service constructor extracted from a rewired module
  MyService,
  // (optional) mocked service dependencies (constructor params)
  {
    '@xxx/abc': {},
    '@xxx/xyz': {},
  },
  // (optional) pre-stubing methods
  {
    a: 1,
    b: () => 2,
  }
);

// start test
it('ok', async () => {
  // retrieve the rewired service
  const rewiredMyService = await myServiceRewiring.getInstance();

  // test a method
  const result = rewiredMyService.someMethod();
  expect(result).equal('xxx');
});
```

### The [`ServiceRewiring`](https://lamnhan.com/testing/classes/servicerewiring.html)

[`ServiceRewiring`](https://lamnhan.com/testing/classes/servicerewiring.html) is the constructor of `rewireService`, see `rewireService` for the list of parameters.

| Method | Returns type | Description |
| --- | --- | --- |
| `getInstance()` | `object` | Get a instance of the rewired service |
| `getStubbedInstance()` | [`MockBuilder`](#the-mockbuilder) | Get the stubbing result |
| `getMockedServices()` | `object` | Get all mocked dependencies |
| `stub(method)` | [`sinon.SinonStub`](https://sinonjs.org/releases/latest/stubs/) | Stub a method of the service |
| `getName()` | `string` | Get the name of the service |
| `getResult()` | `object` | Get all data |

## [`rewireFull(input, mockedModules, serviceInterface, mockedServices, withStubs)`](https://lamnhan.com/testing/index.html#rewirefull)

Rewire both module & service.

### The [`FullRewiring`](https://lamnhan.com/testing/classes/fullrewiring.html)

A [`FullRewiring`](https://lamnhan.com/testing/classes/fullrewiring.html) instance provides properties/methods to retrieve data for testing.

| method | Returns type | Description |
| --- | --- | --- |
| `rewireModule()` | [`ModuleRewiring`](#the-modulerewiring) | The module rewiring instance |
| `rewireService()` | [`Promise<ServiceRewiring>`](#the-servicerewiring) | The service rewiring instance |
| `getResult()` | `Promise<object>` | Get all data |

## Rewiring examples

All testing examples is using [mocha](https://mochajs.org/) as test runner and [chai](https://www.chaijs.com/) as assertion tool.

### Rewire module

An example of how to rewire a module.

**`./src/module1.ts`**

```ts
import { resolve } from 'path';

export function doSomething() {
  const useExternal = resolve('xxx');
  return 'something';
}
```

**`./test/module1.spec.ts`**

```ts
import { rewireModule } from '@lamnhan/testing';

// setup
function getModule() {
  return rewireModule(
    // load the tested module
    '@src/module1',
    // rewire all dependencies with mocked replacement
    {
      'path': {
        resolve: () => 'any mocked returns value',
        // mock other methods of this module
      },
    }
  );
}

// start testing
describe('Test module1', () => {

  it('#doSomething', async () => {
    // retrieve the rewired module
    const module1Rewiring = getModule();
    const rewiredModule1 = await module1Rewiring.getModule();

    // test a module member
    const result = rewiredModule1.doSomething();
    expect(result).equal('xxx');
  });

});

```

### Rewire service

An example of how to rewire a service.

**`./src/module1.ts`**

```ts
export class Service1 {

  constructor() {}

  doSomething(param1: any) {
    // do something with the 'param1'
    return 'something';
  }

}
```

**`./src/module2.ts`**

```ts
import { Service1 } from './module1';

export class Service2 {

  private service1: Service1;

  constructor(service1: Service1) {
    this.service1 = service1;
  }

  doSomething() {
    const useExternal = this.service1.doSomething('xxx');
    return 'something';
  }

}
```

**`./test/module2.spec.ts`**

```ts
import { rewireService } from '@lamnhan/testing';

import { Service2 } from '../src/module2';

// setup
function getService() {
  return rewireService(
    // rewire this service
    Service2,
    // replace all dependencies with mocked replacement
    {
      '@src/module1': {
        doSomething1: 'any mocked returns value';
      },
    },
    // no stubbing for now
  );
}

// start testing
describe('Test Service2', () => {

  it('#doSomething2', async () => {
    // retrieve the rewired service
    const service2Rewiring = getService();
    const rewiredService2 = await service2Rewiring.getInstance();
    // retrieve a mocked servics for passed argument testing
    const { '@src/module1': mockedModule1 } = service2Rewiring.getMockedServices();

    // test a module member
    const result = rewiredService2.doSomething();
    expect(result).equal('...');
    expect(
      mockedModule1.getArgFirst('doSomething'), // get the first arg of #doSomething
    ).equal('xxx');
  });

});
```

## Fully rewiring

An example of how to rewire a module and a service with full functionality.

**`./src/module1.ts`**

```ts
import { resolve } from 'path';
import { readFile } from 'fs-extra';

import { Service2 } from './service2';

export class MyService {

  private service2: Service2;

  constructor(service2: Service2) {
    this.service2 = service2;
  }

  doSomething() {
    const usePath = resolve('xxx');
    const useFSExtra = readFile('xxx.txt');
    const useService2 = this.service2.doSomething('xxx');
    return 'something';
  }

  doMore() {
    const useThis = this.doSomething();
    return 'do more';
  }

}
```

**`./test/module1.spec.ts`**

```ts
import { rewireFull } from '@lamnhan/testing';

import { MyService } from '../src/module1';

// setup test
async function setup(
  stubs: any,
) {
  return rewireFull(
    // load the tested module
    '@src/module1', // () => import('../src/module1')
    // rewire all dependencies with mocked replacement
    {
      'path': {
        resolve: () => 'any mocked returns value',
        // mock other methods of this module
      },
      '~fs-extra': {
        readFile: async () => 'any mocked returns value',
        // mock other methods of this module
      }
    }
    // rewire this service
    MyService,
    // replace all dependencies with mocked replacement
    {
      '@src/service2': {
        doSomething: 'any mocked returns value';
      },
    },
    stubs,
  )
  .getResult();
}

// start testing
describe('Test MyService', () => {

  it('#doSomething', async () => {
    // retrieve the data
    const {
      service,
      mockedModules: {
        'path': mockedPathModuleTesting,
        '~fs-extra': mockedFSExtraModuleTesting,
      },
      mockedServices: {
        '@src/service2': mockedService2Testing,
      }
    } = await setup();

    // test a service method
    const result = service.doSomething();
    expect(result).equal('...');
    // do more assertions about passed arguments
    const resolveArgs = mockedPathModuleTesting.getArgFirst('resolve');
    const readFileArg = mockedFSExtraModuleTesting.getArgFirst('readFile');
    const doSomethingArg = mockedService2Testing.getArgFirst('doSomething');
    expect(resolveArg).equal('xxx');
    expect(readFileArg).equal('xxx.txt');
    expect(doSomethingArg).equal('xxx');
    // ...
  });

  it('#doMore', async () => {
    // retrieve the data
    const { service } = await setup({
      doSomething: 'returns something else',
    });

    // test a service method
    const result = service.doMore();
    expect(result).equal('...');
  });

});
```
