
You can either stubbing a service method manually with [sinon](https://sinonjs.org) or automatically using the [`withStubs`](#rewireserviceserviceconstructor-mockedservices-withstubs) param.

To stub methods, you need to retrieve a [`ServiceRewiring`](#the-servicerewiring) using [`rewireService`](#rewireserviceserviceconstructor-mockedservices-withstubs) or [`rewireFull`](#rewirefullinput-mockedmodules-serviceinterface-mockedservices-withstubs) first.

## Manually stubbing

```ts
// rewire the service
const serviceRewiring = rewireService(MyService);
// stub a method
const doSomethingStub = serviceRewiring.stub('doSomething').returns('anything');
const doMoreStub = serviceRewiring.stub('doMore').callsFake('do more');
```

See more about sinon stubbing at: <https://sinonjs.org/releases/latest/stubs/>

## Auto stubbing

With the `withStubs` param, you can provide multiple stubbing methods and be able to get the stubed result a [`MockBuilder`](#the-mockbuilder) instance.

A stub can [returns](#mocked-returns) any value same as a mocking member.

```ts
// rewire the service
const serviceRewiring = rewireService(
  MyService,
  {}, // no dependencies
  {
    doSomething: 'anything',
    doMore: async () => 'do more',
    // more stubs
  }
);
// get service & stubbed
const service = serviceRewiring.getInstance();
const stubbedService = serviceRewiring.getStubbedInstance();
// testing
const result = service.doNothing();
const doSomethingArgs = stubbedService.getResult('doSomething').getArgs();
// do assertion
```
