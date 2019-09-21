// tslint:disable: no-any
import { MockBuilder } from './mocking';
import {
  ModuleLoader,
  ModuleRewiring,
  ServiceRewiring,
} from './rewiring';

export function buildMock<Methods>(methods: Methods) {
  return new MockBuilder(methods);
}

export function rewireModule<
  Module,
  MockedModules extends {
    [moduleId: string]: Function | {}; // funtion => default or a mocked module
  }
>(
  loader: ModuleLoader<Module>,
  mockedModules?: MockedModules,
) {
  return new ModuleRewiring(loader, mockedModules);
}

export function rewireService<
  Service,
  MockedServices extends {
    [serviceName: string]: {}; // a mocked service
  },
  ServiceStubs extends {
    [method in keyof Service]: any; // a function (async) or returns value
  }
>(
  service: new (...args: any[]) => Service,
  mockedServices: MockedServices = {} as MockedServices,
  withStubs: ServiceStubs = {} as ServiceStubs,
) {
  return new ServiceRewiring(service, mockedServices, withStubs);
}

export { rewireFull } from './rewiring';
