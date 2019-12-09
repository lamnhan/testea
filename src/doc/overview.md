| Exports | Returns type | Description |
| --- | --- | --- |
| `rewiremock` | [`rewiremock`](https://github.com/theKashey/rewiremock) | The rewiremock instance (for manually rewiring) |
| `sinon` | [`sinon`](http://sinonjs.org/) | The sinon instance |
| [`mockModule(members)`](https://lamnhan.com/testea/api/index.html#mockmodule) | [[MockBuilder]] | Create a mock module |
| [`mockService(members)`](https://lamnhan.com/testea/api/index.html#mockservice) | [[MockBuilder]] | Create a mock service |
| [`rewireModule(input, mockedModules)`](https://lamnhan.com/testea/api/index.html#rewiremodule) | [[ModuleRewiring]] | Rewire a service |
| [`rewireService(serviceConstructor, mockedServices, withStubs)`](https://lamnhan.com/testea/api/index.html#rewireservice) | [[ServiceRewiring]] | Rewire a service |
| [`rewireFull(input, mockedModules, serviceInterface, mockedServices, withStubs)`](https://lamnhan.com/testea/api/index.html#rewirefull) | [[FullRewiring]] | Rewiring both module & service |
