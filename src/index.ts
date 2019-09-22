// tslint:disable: no-any
import { MockBuilder } from './mocking';
import {
  ModuleLoader,
  ModuleMocks,
  ServiceMocks,
  ServiceStubing,
  ServiceConstructor,
  ModuleRewiring,
  ServiceRewiring,
} from './rewiring';

export { MockedModule, MockedService } from './mocking';
export { ServiceStubing, rewireFull } from './rewiring';

export { buildMock as mockModule };
export { buildMock as mockService };

export function buildMock<Methods>(methods: Methods) {
  return new MockBuilder(methods);
}

export function rewireModule<
  Module,
  MockedModules extends ModuleMocks
>(
  loader: ModuleLoader<Module>,
  mockedModules?: MockedModules,
) {
  return new ModuleRewiring(loader, mockedModules);
}

export function rewireService<
  Service,
  MockedServices extends ServiceMocks,
  ServiceStubs extends ServiceStubing<Service>
>(
  serviceConstructor: ServiceConstructor<Service>,
  mockedServices: MockedServices = {} as MockedServices,
  withStubs: ServiceStubs = {} as ServiceStubs,
) {
  return new ServiceRewiring(serviceConstructor, mockedServices, withStubs);
}
