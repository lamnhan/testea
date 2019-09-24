// tslint:disable: no-any ban-ts-ignore
import { resolve } from 'path';
import rewiremock from 'rewiremock';
import * as sinon from 'sinon';

import { MockedValue } from './mocking';

rewiremock.overrideEntryPoint(module);

export type ModuleLoader<Module> = () => Promise<Module>;

export interface ModuleMocks {
  [moduleId: string]: Function | {}; // a default funtion or a full mocked module
}

export interface ServiceMocks {
  [serviceId: string]: {}; // a mocked service
}

export type ServiceStubing<Service> = {
  [method in keyof Service]?: MockedValue; // a async function or a value
}

export type ServiceStubed<Service> = {
  [method in keyof Service]?: sinon.SinonStub;
};

export type ServiceConstructor<Service> = new (...args: any[]) => Service;

export class ModuleRewiring<
  Module,
  MockedModules extends ModuleMocks
> {

  private input: string | ModuleLoader<Module>;
  private mockedModules: MockedModules = {} as MockedModules;

  constructor(
    input: string | ModuleLoader<Module>,
    mockedModules: MockedModules = {} as MockedModules,
  ) {
    this.input = input;
    this.mockedModules = mockedModules;
  }

  async getModule() {
    const loader: ModuleLoader<Module> = (
      this.input instanceof Function ?
      this.input :
      () => import(
        this.resolvePath(this.input as string)
      )
    );
    return rewiremock.around(loader, mock => {
      if (!!this.mockedModules) {
        // rewire all dependencies
        for (let path of Object.keys(this.mockedModules)) {
          const mocked = this.mockedModules[path];
          // resolve path
          path = this.resolvePath(path);
          // start mocking
          if (mocked instanceof Function) {
            mock(() => import(path)).withDefault(mocked);
          } else {
            mock(() => import(path)).with(mocked);
          }
        }
      }
    });
  }

  async getService(name: keyof Module) {
    const rewiredModule = await this.getModule();
    return rewiredModule[name];
  }

  getMocked() {
    return this.mockedModules;
  }

  private resolvePath(path: string) {
    // xxx => native module
    if (path.substr(0, 1) === '~') {
      // ~xxx => ./node_modules/xxx
      path = resolve('.', 'node_modules', path.replace('~', ''));
    } else if (path.substr(0, 5) === '@src/') {
      // @src/xxx/abc => ./src/xxx/abc
      path = resolve('.', path.replace('@src/', 'src/'));
    } else if (path.substr(0, 1) === '@') {
      // @xxx/abc => ./src/xxx/abc
      path = resolve('.', path.replace('@', 'src/'));
    }
    return path;
  }

}

export class ServiceRewiring<
  Service,
  MockedServices extends ServiceMocks,
  ServiceStubs extends ServiceStubing<Service>
> {

  private serviceInstance: Service;
  private mockedServices: MockedServices;
  private stubedMethods: ServiceStubed<Service> = {};

  constructor(
    serviceConstructor: ServiceConstructor<Service>,
    mockedServices: MockedServices = {} as MockedServices,
    withStubs: ServiceStubs = {} as ServiceStubs,
  ) {
    // save mocked services
    this.mockedServices = mockedServices;
    // init instance
    const mockedServicesAsArgs: any[] = [];
    if (!!mockedServices) {
      for (const name of Object.keys(mockedServices)) {
        mockedServicesAsArgs.push(mockedServices[name]);
      }
    }
    this.serviceInstance = new serviceConstructor(...mockedServicesAsArgs);
    // stubs
    this.setStubs(withStubs);
  }

  getInstance() {
    return this.serviceInstance;
  }

  getMocked() {
    return this.mockedServices;
  }

  stub(method: keyof Service) {
    if (!this.stubedMethods[method]) {
      this.stubedMethods[method] = sinon.stub(this.serviceInstance, method);
    }
    return this.stubedMethods[method] as sinon.SinonStub;
  }

  setStubs(stubs: ServiceStubs) {
    for (const method of Object.keys(stubs)) {
      const methodName = method as keyof Service;
      this.setStub(methodName, stubs[methodName]);
    }
    return this;
  }

  setStub(method: keyof Service, stubed: any) {
    const stub = this.stub(method);
    if (stubed instanceof Function) {
      stub.callsFake(stubed);
    } else {
      stub.returns(stubed);
    }
    return this;
  }

  getStubs() {
    return this.stubedMethods;
  }

  getStub(method: keyof Service) {
    return this.stubedMethods[method];
  }

  restoreStubs() {
    for (const method of Object.keys(this.stubedMethods)) {
      this.restoreStub(method as keyof Service);
    }
    return this;
  }

  restoreStub(method: keyof Service) {
    if (!!this.stubedMethods[method]) {
      (this.stubedMethods[method] as sinon.SinonStub).restore();
    }
    return this;
  }

}

export class Rewiring<
  Module,
  MockedModules extends ModuleMocks,
> {

  private input: string | ModuleLoader<Module>;
  private mockedModules: MockedModules = {} as MockedModules;

  constructor(
    input: string | ModuleLoader<Module>,
    mockedModules: MockedModules = {} as MockedModules,
  ) {
    this.input = input;
    this.mockedModules = mockedModules;
  }

  rewireModule() {
    return new ModuleRewiring(this.input, this.mockedModules);
  }

  rewireService<
    Service,
    MockedServices extends ServiceMocks,
    ServiceStubs extends ServiceStubing<Service>
  >(
    serviceInterface: ServiceConstructor<Service>,
    mockedServices: MockedServices = {} as MockedServices,
    withStubs: ServiceStubs = {} as ServiceStubs,
  ) {
    return new ServiceRewiring(serviceInterface, mockedServices, withStubs);
  }

  async rewireFull<
    Service,
    MockedServices extends ServiceMocks,
    ServiceStubs extends ServiceStubing<Service>
  >(
    serviceInterface: ServiceConstructor<Service>,
    mockedServices: MockedServices = {} as MockedServices,
    withStubs: ServiceStubs = {} as ServiceStubs,
  ) {
    // rewire module
    const moduleRewiring = new ModuleRewiring(this.input, this.mockedModules);
    const mockedModulesOutput = moduleRewiring.getMocked();
    // rewire service
    const serviceName = serviceInterface.name as keyof Module;
    // @ts-ignore
    const serviceConstructor: ServiceConstructor<Service> = await moduleRewiring.getService(serviceName);
    const serviceRewiring = new ServiceRewiring(
      serviceConstructor,
      mockedServices,
      withStubs,
    );
    const mockedServicesOutput = serviceRewiring.getMocked();
    const service = serviceRewiring.getInstance() as Service;
    // return all data
    return new FullRewiringResult(
      // module
      moduleRewiring,
      mockedModulesOutput,
      // service
      serviceName,
      serviceRewiring,
      mockedServicesOutput,
      service,
    );
  }

}

export class FullRewiringResult<
  Module,
  MockedModules extends ModuleMocks,
  Service,
  MockedServices extends ServiceMocks,
  ServiceStubs extends ServiceStubing<Service>
> {

  // module
  moduleRewiring: ModuleRewiring<Module, MockedModules>;
  mockedModules: MockedModules;
  // service
  serviceName: keyof Module;
  serviceRewiring: ServiceRewiring<Service, MockedServices, ServiceStubs>;
  mockedServices: MockedServices;
  service: Service;

  constructor(
    // module
    moduleRewiring: ModuleRewiring<Module, MockedModules>,
    mockedModules: MockedModules,
    // service
    serviceName: keyof Module,
    serviceRewiring: ServiceRewiring<Service, MockedServices, ServiceStubs>,
    mockedServices: MockedServices,
    service: Service,
  ) {
    // module
    this.moduleRewiring = moduleRewiring;
    this.mockedModules = mockedModules;
    // service
    this.serviceName = serviceName;
    this.serviceRewiring = serviceRewiring;
    this.mockedServices = mockedServices;
    this.service = service;
  }

  getModuleRewiring() {
    return this.moduleRewiring;
  }

  getMockedModules() {
    return this.mockedModules;
  }

  getMockedModule(id: keyof MockedModules) {
    return this.mockedModules[id];
  }

  getServiceName() {
    return this.serviceName;
  }

  getServiceRewiring() {
    return this.serviceRewiring;
  }
  
  getMockedServices() {
    return this.mockedServices;
  }

  getMockedService(id: keyof MockedServices) {
    return this.mockedServices[id];
  }

  getService() {
    return this.service;
  }

}
