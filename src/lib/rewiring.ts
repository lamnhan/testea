/* eslint-disable @typescript-eslint/ban-ts-ignore */
import {resolve} from 'path';
import * as sinon from 'sinon';

import {rewiremock} from './rewiremock';
import {MockedValue, MockedService, MockBuilder} from './mocking';

export type ModuleLoader<Module> = () => Promise<Module>;

export interface ModuleMocks {
  [moduleId: string]: Function | {}; // a default funtion or a full mocked module
}

export interface ServiceMocks {
  [serviceId: string]: {}; // a mocked service
}

export type ServiceConstructor<Service> = new (...args: any[]) => Service;

export type ServiceStubing<Service> = {
  [method in keyof Service]?: MockedValue; // a async function or a value
};

type ServiceStubed<Service> = {
  [method in keyof Service]?: sinon.SinonStub;
};

export class ModuleRewiring<Module, MockedModules extends ModuleMocks> {
  private input: string | ModuleLoader<Module>;
  private mockedModules: MockedModules = {} as MockedModules;

  constructor(
    input: string | ModuleLoader<Module>,
    mockedModules: MockedModules = {} as MockedModules
  ) {
    this.input = input;
    this.mockedModules = mockedModules;
  }

  async getResult() {
    const moduleRewiring = this as ModuleRewiring<Module, MockedModules>;
    const mockedModules = this.getMockedModules();
    const module = await this.getModule();
    return {moduleRewiring, mockedModules, module};
  }

  async getModule() {
    const loader: ModuleLoader<Module> =
      this.input instanceof Function
        ? this.input
        : () => import(this.resolvePath(this.input as string));
    return rewiremock.around(loader, mock => {
      if (this.mockedModules) {
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

  getMockedModules() {
    return this.mockedModules;
  }

  private resolvePath(path: string) {
    // xxx => native module
    // ~xxx => ./node_modules/xxx
    if (path.substr(0, 1) === '~') {
      path = resolve('.', 'node_modules', path.replace('~', ''));
    }
    // @src/xxx/abc => ./src/xxx/abc
    else if (path.substr(0, 5) === '@src/') {
      path = resolve('.', path.replace('@src/', 'src/'));
    }
    // @xxx/abc => ./src/xxx/abc
    else if (path.substr(0, 1) === '@') {
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
  private serviceName: string;
  private serviceInstance: Service;
  private mockedServices: MockedServices;
  private stubedMethods: ServiceStubed<Service> = {};

  constructor(
    serviceConstructor: ServiceConstructor<Service>,
    mockedServices: MockedServices = {} as MockedServices,
    withStubs: ServiceStubs = {} as ServiceStubs
  ) {
    // save mocked services
    this.mockedServices = mockedServices;
    // get name
    this.serviceName = serviceConstructor.name;
    // init instance
    const mockedServicesAsArgs: any[] = [];
    if (mockedServices) {
      for (const name of Object.keys(mockedServices)) {
        mockedServicesAsArgs.push(mockedServices[name]);
      }
    }
    this.serviceInstance = new serviceConstructor(...mockedServicesAsArgs);
    // stubs
    if (!!withStubs && !!Object.keys(withStubs).length) {
      this.setStubs(withStubs);
    }
  }

  getResult() {
    const serviceRewiring = this as ServiceRewiring<
      Service,
      MockedServices,
      ServiceStubs
    >;
    const mockedServices = this.getMockedServices();
    const service = this.getInstance();
    const serviceTestea = this.getStubbedInstance();
    return {serviceRewiring, mockedServices, service, serviceTestea};
  }

  getName() {
    return this.serviceName;
  }

  getInstance() {
    return this.serviceInstance;
  }

  getStubbedInstance() {
    const stubbedService: any = this.serviceInstance;
    return stubbedService as MockedService<ServiceStubs>;
  }

  getMockedServices() {
    return this.mockedServices;
  }

  stub(method: keyof Service) {
    if (!this.stubedMethods[method]) {
      this.stubedMethods[method] = sinon.stub(this.serviceInstance, method);
    }
    return this.stubedMethods[method] as sinon.SinonStub;
  }

  private setStubs(stubs: ServiceStubs) {
    const stubbingMethods = Object.keys(stubs);
    // create a mocked service
    const mockedService = new MockBuilder(stubs);
    // patch the service
    const props = Object.keys(mockedService).concat(
      Object.getOwnPropertyNames(
        // @ts-ignore
        mockedService.__proto__
      ).filter(x => x !== 'constructor')
    );
    for (const prop of props) {
      const propName = prop as keyof Service;
      // rename conflict props
      if (
        stubbingMethods.indexOf(prop) === -1 && // not a stubbing prop
        !!this.serviceInstance[propName] // exists in the service
      ) {
        this.serviceInstance[
          ('$' + prop) as keyof Service
        ] = this.serviceInstance[propName];
      }
      // patching
      // @ts-ignore
      this.serviceInstance[propName] = mockedService[prop];
    }
  }
}

export class FullRewiring<
  Module,
  MockedModules extends ModuleMocks,
  Service,
  MockedServices extends ServiceMocks,
  ServiceStubs extends ServiceStubing<Service>
> {
  private moduleRewiring: ModuleRewiring<Module, MockedModules>;
  private serviceInterface: ServiceConstructor<Service>;
  private mockedServices: MockedServices;
  private withStubs: ServiceStubs;

  constructor(
    input: string | ModuleLoader<Module>,
    mockedModules: MockedModules = {} as MockedModules,
    serviceInterface: ServiceConstructor<Service>,
    mockedServices: MockedServices = {} as MockedServices,
    withStubs: ServiceStubs = {} as ServiceStubs
  ) {
    // rewire module
    this.moduleRewiring = new ModuleRewiring(input, mockedModules);
    // save service info
    this.serviceInterface = serviceInterface;
    this.mockedServices = mockedServices;
    this.withStubs = withStubs;
  }

  async getResult() {
    // rewire module
    const moduleRewiring = this.rewireModule();
    const mockedModules = moduleRewiring.getMockedModules();
    const module = await moduleRewiring.getModule();
    // rewire service
    const serviceRewiring = await this.rewireService();
    const mockedServices = serviceRewiring.getMockedServices();
    const service = serviceRewiring.getInstance() as Service;
    const stubbedService = serviceRewiring.getStubbedInstance();
    // return result
    return {
      // module
      moduleRewiring,
      mockedModules,
      module,
      // service
      serviceRewiring,
      mockedServices,
      service,
      stubbedService,
    };
  }

  rewireModule() {
    return this.moduleRewiring;
  }

  async rewireService() {
    const serviceConstructor = await this.moduleRewiring.getService(
      this.serviceInterface.name as keyof Module
    );
    return new ServiceRewiring(
      // @ts-ignore
      serviceConstructor as ServiceConstructor<Service>,
      this.mockedServices,
      this.withStubs
    );
  }
}
