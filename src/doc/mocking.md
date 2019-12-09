## [`mockModule(members)`](https://lamnhan.com/testea/index.html#mockmodule)

Create a mock module for testea purpose, this method is a proxy to the [`MockBuilder`](#the-mockbuilder).

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
  a: () => 'something else',
  b: async () => 'never',
});

// start using the mocked module
```

## [`mockService(members)`](https://lamnhan.com/testea/index.html#mockservice)

Create a mock service for testea purpose, this method is a proxy to the [`MockBuilder`](#the-mockbuilder). See [`mockModule`](#mockmodulemembers) for usage info.

## The [`MockBuilder`](https://lamnhan.com/testea/classes/mockbuilder.html)

The [`MockBuilder`](https://lamnhan.com/testea/classes/mockbuilder.html) constructor create a mocked object for mocking modules and services.

```ts
const mocked = new MockBuilder({
  '.A': 0, // prop 'A' contains a value of 0
  a: () => 1, // method 'a' returns 1
  b: async () => 2, // method 'b' async returns 2
});
```

The [`MockBuilder`](#the-mockbuilder) create a mocked instance of any modules or services with every method defined in the `members` param. When a method is called, the mocked instance record all arguments and returns a value that defined by the `members` param.

**Note**: To mock a property, just add a `.` before the property name.

### Mocked returns

These are the supported returns values.

- `*`: returns `this` (the mocked instance)
- `.`: returns the first argument
- `.$`: async returns the first argument
- `...`: returns the list of arguments
- `...$`: async returns the list of arguments
- `!`: throws an error, with custom message: `!=The message!`
- `!$`: async reject, with custom message: `!$=The message!`
- `Function`: returns the result of this function (with the same arguments as the original method)
- `any`: returns as is: `string`, `number`, `boolean`, `{}`, `any[]`

### Instance methods

A [`MockBuilder`](#the-mockbuilder) instance provides these methods for retrieving testea data.

- `getProp(prop)`: Get a mocked property value
- `getResult(member)`: Get the result for a certain member, returns `MockedResult`](#the-mockedresult)
- `getAllReturns()`: Get all the data holded by the Returns Keeper
- `getAllArgs()`: Get all the data holded by the Args Keeper
- `getAllStackedArgs()`: Get all the data holded by the StackedArgs Keeper

## The [`MockedResult`](https://lamnhan.com/testea/classes/mockedresult.html)

The [`MockedResult`](https://lamnhan.com/testea/classes/mockedresult.html) constructor provide values and methods for testea a mocked method.

- `getArgs()`: Get a list of args
- `countArgs()`: Get the number of args
- `getArg(position)`: Get an arg by paramter position
- `getArgFirst()`: Get the first arg
- `getArgSecond()`: Get the second arg
- `getArgThird()`: Get the third arg
- `getArgLast()`: Get the last arg
- `getStackedArgs()`: Get a list of stacked args
- `countStackedArgs()`: Get the number of stacked args (same as `callCount()`)
- `getStackedArgsChild(execution)`: Get a list of args by execution order
- `getStackedArgsFirst()`: Get a list of args of the first execution
- `getStackedArgsSecond()`: Get a list of args of the second execution
- `getStackedArgsThird()`: Get a list of args of the third execution
- `getStackedArgsLast()`: Get a list of args of the last execution
- `getArgInStack(execution, position)`: Get an arg by execution order and parameter position
- `hasBeenCalled()`: See if a method has been called
- `hasBeenCalledWith(...args)`: See if a method has been called with certain args
- `callCount()`: Get the number of call

## Mocking example

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
  doSomething2: async () => 'any mocked returns value',
});

// start using the mocked module
```
