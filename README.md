# @lamnhan/testing

Rewiring, mocking & helpers for testing modules in Node.

<!-- <block:header> -->

[![License][license_badge]][license_url] [![Support me on Patreon][patreon_badge]][patreon_url] [![PayPal][paypal_donate_badge]][paypal_donate_url] [![Ask me anything][ask_me_badge]][ask_me_url]

<!-- </block:header> -->

## Table of content

- [Install](#install)
- [Terminology](#terminology)
- [API overview](#api-overview)
- [Mocking](#mocking)
  - [`mockModule()`](#mock-module)
  - [`mockService()`](#mock-service)
  - [The `MockBuilder`](#mock-builder)
    - [Mocked returns](#mocked-returns)
    - [Instance methods](#instance-methods)
- [Rewiring](#rewiring)
  - [`rewireModule()`](#rewire-module)
  - [`rewireService()`](#rewire-service)
  - [`rewire()`](#rewire)
  - [`rewireFull()`](#rewire-full)
- [Examples](#examples)
  - [Mocking](#mocking-example)
  - [Rewire a module](#rewire-module-example)
  - [Rewire a service](#rewire-service-example)
  - [Fully rewiring](#rewire-full-example)
- [API reference](https://lamnhan.com/testing)

## Install

`npm install --save-dev @lamnhan/testing`

```ts
import { mockModule } from '@lamnhan/testing';

const mocked = mockModule({
  a: () => 1,
  b: async () => 2,
});

// test begins
```

Detail API reference at: <https://lamnhan.com/testing>

## Terminology

### `Module` and `Mocked module`

A `module` is a dependency or a file that is imported by your code. Example: `path` module, `module1` module, ...

```ts
import { resolve } from 'path';
import { something } from './module1';
```

There are 3 kinds of module:

- **Native**: Node builtin modules
- **Installed**: installed `node_modules/` dependencies
- **Local**: any files in the `src/` folder

A `mocked module` is a module that was created to replace the original module for testing purpose.

### `Service` and `Mocked service`

A `service` is an exported member of a `module`, usually an exported `class` in a `module`. Example: `MyService` service, `AnotherService` service, ...

```ts
import { MyService } from './module1';
import { AnotherService } from './module2';
```

A `mocked service` is a service that was created to replace the original service for testing purpose.

## API overview

| Methods | Returns type | Description |
| --- | --- | --- |
| `mockModule(members)` | `MockBuilder` | Create a mock module |
| `mockService(members)` | `MockBuilder` | Create a mock service |
| `rewireModule(loader, mockedModules)` | `ModuleRewiring` | Rewire a service |
| `rewireService(serviceConstructor, mockedServices, withStubs)` | `ServiceRewiring` | Rewire a service |
| `rewire(loader, mockedModules)` | `Rewiring` | Unify api for rewiring both module & service |
| `rewireFull(loader, mockedModules, serviceInterface, mockedServices, withStubs)` | `FullRewiringResult` | Shortcut to `rewire(...).rewireFull(...)` |

## Mocking

### [`mockModule(members)`](#mock-module)

Create a mock module for testing purpose, this method is a proxy to the [`MockBuilder`](#mockbuilder).

The original module, for example:

```ts
function a() {
  // do something
  return 'something';
}

async function b() {
  // do somthing else
  return 'nothing at all';
}

export { a, b };
```

Create a mocked version of the original module:

```ts
const mockedModule = mockModule({
  a: () => 1,
  b: async () => 2,
});

// start using the mocked module
```

### [`mockService(members)`](#mock-service)

Create a mock service for testing purpose, this method is a proxy to the `MockBuilder`. See `mockModule` for usage info.

### [The `MockBuilder`](#mockbuilder)

The `MockBuilder` constructor create a mocked object for mocking modules and services.

```ts
const mocked = new MockBuilder({
  a: () => 1,
  b: async () => 2,
});
```

The `MockBuilder` create a mocked instance of any modules or services with every method defined in the `members` param. When a method is called, the mocked instance record all arguments and returns a value that defined by the `members` param.

#### [Mocked returns](#mocked-returns)

These are the supported returns values.

- `*`: returns `this`
- `.`: returns the first argument
- `Function`: returns the result of this function (with the same arguments as the original method)
- `any`: returns as is any other values: `string`, `number`, `boolean`, `{}`, `any[]`, ...

#### [Instance methods](#mocked-methods)

A `MockBuilder` instance provides these methods for retrieving testing data.

- `getAllReturns()`: Get all the data holded by the Returns Keeper
- `getAllArgs()`: Get all the data holded by the Args Keeper
- `getAllStackedArgs()`: Get all the data holded by the StackedArgs Keeper
- `getReturns(member)`: Get the raw value defined for a member to return
- `getReturnsResult(member)`: Get the returned value of a member
- `getArgs(member)`: Get a list of args
- `getArg(member, position)`: Get an arg by paramter position
- `getArgFirst(member)`: Get the first arg
- `getArgSecond(member)`: Get the second arg
- `getArgThird(member)`: Get the third arg
- `getStackedArgs(member)`: Get a list of stacked args
- `getStackedArgsChild(member, execution)`: Get a list of args by execution order
- `getStackedArgsChildFirst(member)`: Get a list of args of the first execution
- `getStackedArgsChildSecond(member)`: Get a list of args of the second execution
- `getStackedArgsChildThird(member)`: Get a list of args of the third execution
- `getArgInStack(member, execution, position)`: Get an arg by execution order and parameter position
- `getArgInStack1X1(member)`: Get the first arg of the first execution
- `getArgInStack1X2(member)`: Get the second arg of the first execution
- `getArgInStack1X3(member)`: Get the third arg of the first execution
- `getArgInStack2X1(member)`: Get the first arg of the second execution
- `getArgInStack2X2(member)`: Get the second arg of the second execution
- `getArgInStack2X3(member)`: Get the third arg of the second execution
- `getArgInStack3X1(member)`: Get the first arg of the third execution
- `getArgInStack3X2(member)`: Get the second arg of the third execution
- `getArgInStack3X3(member)`: Get the third arg of the third execution

## Rewiring

Load modules or services with mocked dependencies.

A rewiring dependency is resolved by an `ID`, depending on the kind of a module:

- **Native**: the `id` is the same as the `name`: `path`, `os`, ...
- **Installed**: the `id` is the dependency name prefixed by a `~`:
  - `~lodash` -> **./node_modules/lodash**
  - `~@xxx/abc` -> **./node_modules/xxx/abc**
- **Local**: the `id` is prefixed by a `@`:
  - `@src/xxx/abc` -> **./src/xxx/abc**
  - Or `@xxx/abc` -> **./src/xxx/abc**

### [`rewireModule(loader, mockedModules)`](#rewire-module)

Load a module with mocked dependencies.

```ts
// rewire the 'module1'
const module1Rewiring = rewireModule(
  // load the original module
  () => import('../src/module1'),
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

`ModuleRewiring` is the constructor of `rewireModule`, see `rewireModule` for the list of parameters.

| Method | Returns type | Description |
| --- | --- | --- |
| `getMocked()` | `object` | Get all mocked dependencies |
| `getModule()` | `Promise<object>` | Get the rewired module |
| `getService(name)` | `Promise<class>` | Get a service constructor of the mocked module |

### [`rewireService(serviceConstructor, mockedServices, withStubs)`](#rewire-service)

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

`ServiceRewiring` is the constructor of `rewireService`, see `rewireService` for the list of parameters.

| Method | Returns type | Description |
| --- | --- | --- |
| `getInstance()` | `object` | Get a instance of the rewired service |
| `getMocked()` | `object` | Get all mocked dependencies |
| `stub(method)` | `sinon.SinonStub` | Stub a method of the service |
| `setStubs(stubs)` | `ServiceRewiring` | Stub multiple methods |
| `setStub(method, stubed)` | `ServiceRewiring` | Stub a method |
| `getStubs()` | `object` | Get all stubbed methods |
| `getStub(method)` | `sinon.SinonStub` | Get a stubbed method |
| `restoreStubs()` | `ServiceRewiring` | Restore all stubbed methods |
| `restoreStub(method)` | `ServiceRewiring` | Restore a stubbed method |

### [`rewire(loader, mockedModules)`](#rewire)

Unify api for rewiring both module & service.

`Rewiring` is the constructor of `rewire`, see `rewire` for the list of parameters.

See `rewireModule()`, `rewireService(...)` and `rewireFull(...)` for more detail.

| Method | Returns type | Description |
| --- | --- | --- |
| `rewireModule()` | `ModuleRewiring` | Rewire a module |
| `rewireService(serviceInterface, mockedServices, withStubs)` | `ServiceRewiring` | Rewire a service |
| `rewireFull(serviceInterface, mockedServices, withStubs)` | `Promise<FullRewiringResult>` | Rewire module and service and return all data |

### [`rewireFull(loader, mockedModules, serviceInterface, mockedServices, withStubs)`](#rewire-full)

The shortcut to `rewire(...).rewireFull(...)`, resulting is a `FullRewiringResult` instance.

A `FullRewiringResult` instance provides properties/methods to retrieve data for testing.

| Prop/method | Returns type | Description |
| --- | --- | --- |
| `moduleRewiring` | `ModuleRewiring` | The module rewiring instance |
| `mockedModules` | `object` | All mocked modules |
| `serviceName` | `string` | The rewired service name |
| `serviceRewiring` | `ServiceRewiring` | The service rewiring instance |
| `mockedServices` | `object` | All mocked services |
| `service` | `object` | The rewired service instance |
| `getModuleRewiring()` | `ModuleRewiring` | Get the module rewiring instance |
| `getMockedModules()` | `object` | Get all mocked modules |
| `getMockedModule(id)` | `object` | Get a mocked module |
| `getServiceName()` | `string` | Get the rewired service name |
| `getServiceRewiring()` | `ServiceRewiring` | Get the service rewiring instance |
| `getMockedServices()` | `object` | Get all mocked services |
| `getMockedService(id)` | `object` | Get a mocked service |
| `getService` | `object` | Get the rewired service instance |

## Examples

All testing examples is using `mocha` as test runner and `chai` as assertion tool.

### [Mocking](#mocking-example)

An example of how to create a mocked version of a module or a service.

**`./src/module1.ts`**

```ts
export function doSomething1() {
  // do something
  return 'something';
}

export async function doSomething2() {
  // do somthing else
  return 'nothing at all';
}
```

**`./test/module1.spec.ts`**

```ts
const mockedModule = mockModule({
  doSomething1: 'any mocked returns value',
  doSomething2: async () => 'any mocked returns value,
});

// start using the mocked module
```

### [Rewire a module](#rewire-module-example)

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
    () => import('../src/module1'),
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

### [Rewire a service](#rewire-service-example)

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
    const { '@src/module1': mockedModule1 } = service2Rewiring.getMocked();

    // test a module member
    const result = rewiredService2.doSomething();
    expect(result).equal('...');
    expect(
      mockedModule1.getArgFirst('doSomething'), // get the first arg of #doSomething
    ).equal('xxx');
  });

});
```

### [Fully rewiring](#rewire-full-example)

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
    () => import('../src/module1'),
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
  );
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

## License

@lamnhan/testing is released under the [MIT][license_url] license.

<!-- <block:footer> -->

[license_badge]: https://img.shields.io/github/license/mashape/apistatus.svg
[license_url]: https://github.com/lamnhan/testing/blob/master/LICENSE
[patreon_badge]: https://lamnhan.github.io/assets/images/badges/patreon.svg
[patreon_url]: https://www.patreon.com/lamnhan
[paypal_donate_badge]: https://lamnhan.github.io/assets/images/badges/paypal_donate.svg
[paypal_donate_url]: https://www.paypal.me/lamnhan
[ask_me_badge]: https://img.shields.io/badge/ask/me-anything-1abc9c.svg
[ask_me_url]: https://m.me/lamhiennhan

<!-- </block:footer> -->