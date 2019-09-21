// tslint:disable: no-any ban-ts-ignore
import { resolve } from 'path';
import _rewiremock from 'rewiremock';
import * as sinon from 'sinon';

export type ModuleLoader<Module> = () => Promise<Module>;

export class ModuleRewiring<
  Module,
  MockedModules extends {
    [moduleId: string]: Function | {}; // funtion => default or a mocked module
  }
> {

  private rewiremock: typeof _rewiremock;

  private loader: ModuleLoader<Module>;
  private mockedModules: MockedModules = {} as MockedModules;

  constructor(
    loader: ModuleLoader<Module>,
    mockedModules: MockedModules = {} as MockedModules,
  ) {
    // rewiremock
    this.rewiremock = _rewiremock;
    this.rewiremock.overrideEntryPoint(module);
    // save loader
    this.loader = loader;
    // save mocked modules
    this.mockedModules = mockedModules;
  }

  getMocked() {
    return this.mockedModules;
  }

  async getModule() {
    return this.rewiremock.around(this.loader, mock => {
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

}

export class ServiceRewiring<
  Service,
  MockedServices extends {
    [serviceName: string]: {}; // a mocked service
  },
  ServiceStubs extends {
    [method in keyof Service]: any; // a function (async) or returns value
  }
> {

  private serviceInstance: Service;
  private mockedServices: MockedServices;
  private stubedMethods: {[method in keyof Service]: sinon.SinonStub} = {} as any;

  constructor(
    service: new (...args: any[]) => Service,
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
    this.serviceInstance = new service(...mockedServicesAsArgs);
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
    return this.stubedMethods[method];
  }

  setStubs(serviceStubs: ServiceStubs) {
    for (const method of Object.keys(serviceStubs)) {
      const methodName = method as keyof Service;
      this.setStub(methodName, serviceStubs[methodName]);
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
    return !!this.stubedMethods ? this.stubedMethods[method] : undefined;
  }

  restoreStubs() {
    if (!!this.stubedMethods) {
      for (const method of Object.keys(this.stubedMethods)) {
        const methodName = method as keyof Service;
        this.stubedMethods[methodName].restore();
      }
    }
    return this;
  }

  restoreStub(method: keyof Service) {
    if (this.stubedMethods && !!this.stubedMethods[method]) {
      this.stubedMethods[method].restore();
    }
    return this;
  }

}
