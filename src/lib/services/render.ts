import { ParsedItem } from './parse';
import { TemplateService } from './template';

export class RenderService {

  constructor(private templateService: TemplateService) {}

  async render(parsedItem: ParsedItem) {
    const result: string[] = [];
    // meta imports
    const metaImports = this.templateService.getMetaImports();
    result.push(metaImports);
    // TODO: mocks
    // TODO: setup()
    // suites by classes
    const { classes } = parsedItem;
    classes.forEach(cls => {
      const { name, properties = [], methods = [] } = cls;
      const propertyCases = properties
        .map(prop => this.templateService.getCaseForProperty(prop.NAME));
      const methodCases = methods
        .map(prop => this.templateService.getCaseForMethod(prop.NAME));
      const suite = this.templateService.getSuite(
        name,
        [
          ...propertyCases,
          '',
          ...methodCases
        ].join('\n')
      );
      result.push(suite);
    });
    // result
    return result.join('\n');
  }

}
