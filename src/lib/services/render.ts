import { ParsedItem } from './parse';
import { TemplateService } from './template';

export class RenderService {
  constructor(private templateService: TemplateService) {}

  async render(parsedItem: ParsedItem) {
    const result: string[] = [];
    const {
      path,
      classes,
      moduleImports,
      serviceImports,
      hasModuleMocks,
      hasServiceMocks,
    } = parsedItem;
    // meta imports
    const metaImports = this.templateService.getMetaImports(
      hasModuleMocks,
      hasServiceMocks
    );
    result.push(metaImports);
    // main imports
    const relPathSegs = (path
      .replace(/\\/g, '/')
      .split('/src/')
      .pop() as string).split('/');
    const mainImport = this.templateService.getMainInport(
      classes.map(cls => cls.name),
      '../'.repeat(relPathSegs.length) +
        'src/' +
        relPathSegs.join('/').replace('.ts', '')
    );
    result.push('', mainImport);
    // module mocks
    moduleImports.forEach(imp =>
      result.push('', this.templateService.getModuleMock(imp))
    );
    // service mocks
    serviceImports.forEach(imp =>
      result.push('', this.templateService.getServiceMock(imp))
    );
    // suites by classes
    classes.forEach(cls => {
      // setup
      result.push('', this.templateService.getSetup(path, cls, moduleImports));
      // suite
      const { name, properties = [], methods = [] } = cls;
      const propertyCases = properties.map(prop =>
        this.templateService.getCaseForProperty(prop.NAME, cls.name)
      );
      const methodCases = methods.map(meth =>
        this.templateService.getCaseForMethod(
          meth.NAME,
          meth.PARAMETERS,
          cls.name
        )
      );
      const suite = this.templateService.getSuite(
        name,
        this.templateService.toText([...propertyCases, ...methodCases])
      );
      result.push(suite);
    });
    // result
    return this.templateService.toText(result);
  }
}
