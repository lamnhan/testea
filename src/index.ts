// tslint:disable: no-any
import { MockBuilder } from './mocking';
import {
  ModuleLoader,
  ModuleMocks,
  ServiceMocks,
  ServiceStubing,
  ServiceConstructor,
  Rewiring,
  ModuleRewiring,
  ServiceRewiring,
} from './rewiring';

export { ModuleMocking, ServiceMocking, MockBuilder } from './mocking';
export { ServiceStubing } from './rewiring';

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

export function rewire<Module, MockedModules extends ModuleMocks>(
  input: string | ModuleLoader<Module>,
  mockedModules?: MockedModules
) {
  return new Rewiring(input, mockedModules);
}

export async function rewireFull<
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
  return new Rewiring(input, mockedModules).rewireFull(
    serviceInterface,
    mockedServices,
    withStubs
  );
}
