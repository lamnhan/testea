import * as sinon from 'sinon';
import {MockBuilder} from './mocking';
import {
  ModuleLoader,
  ModuleMocks,
  ServiceMocks,
  ServiceStubing,
  ServiceConstructor,
  ModuleRewiring,
  ServiceRewiring,
  FullRewiring,
} from './rewiring';

export {rewiremock} from './rewiremock';
export {sinon};
export {
  MockedValue,
  ModuleMocking,
  ServiceMocking,
  MockedModule,
  MockedService,
  MockedResult,
  MockBuilder,
} from './mocking';
export {ServiceStubing} from './rewiring';

export function mockModule<Members>(members: Members) {
  return new MockBuilder(members);
}

export function mockService<Members>(members: Members) {
  return new MockBuilder(members);
}

export function rewireModule<Module, MockedModules extends ModuleMocks>(
  input: string | ModuleLoader<Module>,
  mockedModules?: MockedModules
) {
  return new ModuleRewiring(input, mockedModules);
}

export function rewireService<
  Service,
  MockedServices extends ServiceMocks,
  ServiceStubs extends ServiceStubing<Service>
>(
  serviceConstructor: ServiceConstructor<Service>,
  mockedServices: MockedServices = {} as MockedServices,
  withStubs: ServiceStubs = {} as ServiceStubs
) {
  return new ServiceRewiring(serviceConstructor, mockedServices, withStubs);
}

export function rewireFull<
  Module,
  MockedModules extends ModuleMocks,
  Service,
  MockedServices extends ServiceMocks,
  ServiceStubs extends ServiceStubing<Service>
>(
  input: string | ModuleLoader<Module>,
  mockedModules: MockedModules = {} as MockedModules,
  serviceInterface: ServiceConstructor<Service>,
  mockedServices: MockedServices = {} as MockedServices,
  withStubs: ServiceStubs = {} as ServiceStubs
) {
  return new FullRewiring(
    input,
    mockedModules,
    serviceInterface,
    mockedServices,
    withStubs
  );
}
