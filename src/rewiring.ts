// tslint:disable: no-any
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
  [serviceName: string]: {}; // a mocked service
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

  private loader: ModuleLoader<Module>;
  private mockedModules: MockedModules = {} as MockedModules;

  constructor(
    loader: ModuleLoader<Module>,
    mockedModules: MockedModules = {} as MockedModules,
  ) {
    this.loader = loader;
    this.mockedModules = mockedModules;
  }

  getMocked() {
    return this.mockedModules;
  }

  async getModule() {
    return rewiremock.around(this.loader, mock => {
      // rewire all dependencies
      if (!!this.mockedModules) {
        for (let path of Object.keys(this.mockedModules)) {
          // retrieve mocked
          const mocked = this.mockedModules[path];
          // resolve path
          if (path.indexOf('@src/') !== -1) {
            path = resolve('.', path.replace('@src/', 'src/'));
          } else {
            path = resolve('.', 'node_modules', path);
          }
          // start mocking
          if (mocked instanceof Function) {
            mock(() => import(path)).withDefault(mocked);
          } else {
            mock(() => import(path)).mockThrough().with(mocked);
          }
        }
      }
    });
  }

  async getService(name: keyof Module) {
    const rewiredModule = await this.getModule();
    return rewiredModule[name];
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

  private loader: ModuleLoader<Module>;
  private mockedModules: MockedModules = {} as MockedModules;

  constructor(
    loader: ModuleLoader<Module>,
    mockedModules: MockedModules = {} as MockedModules,
  ) {
    this.loader = loader;
    this.mockedModules = mockedModules;
  }

  rewireModule() {
    return new ModuleRewiring(this.loader, this.mockedModules);
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
    const moduleRewiring = new ModuleRewiring(this.loader, this.mockedModules);
    const mockedModulesOutput = moduleRewiring.getMocked();
    // rewire service
    const serviceName = serviceInterface.name as keyof Module;
    const serviceConstructor = await moduleRewiring.getService(serviceName);
    const serviceRewiring = new ServiceRewiring(
      serviceConstructor as any,
      mockedServices,
      withStubs,
    );
    const mockedServicesOutput = serviceRewiring.getMocked();
    const service = serviceRewiring.getInstance() as Service;
    // return all data
    return {
      // module
      moduleRewiring,
      mockedModules: mockedModulesOutput,
      // service
      serviceName,
      serviceRewiring,
      mockedServices: mockedServicesOutput,
      service,
    };
  }

}
