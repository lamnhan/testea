
export class TemplateService {

  constructor () {}

  getMetaImports() {
    return [
      `// tslint:disable: no-any ban-ts-ignore`,
      `import { expect } from 'chai';`,
      `import { ServiceStubing, rewireFull } from '@lamnhan/testing';`
    ].join('\n');
  }

  getSuite(name: string, cases: string) {
    return [
      `describe('${name}', () => {`,
      '',
      cases,
      '',
      `});`
    ].join('\n');
  }

  getCaseForProperty(name: string) {
    const result: string[] = [];
    // opening
    result.push(`it('.${name}', async () => {`);
    // content
    result.push(
      `  const { service } = await setup();`,
      `  expect(service.${name}).equal('...');`
    );
    // closing
    result.push(`});`);
    return result.map(line => '  ' + line).join('\n');
  }

  getCaseForMethod(name: string) {
    const result: string[] = [];
    // opening
    result.push(`it('${name}()', async () => {`);
    // content
    result.push(
      `  const { service } = await setup();`,
      `  const r = service.${name}();`,
      `  expect(r).equal('...');`
    );
    // closing
    result.push(`});`);
    return result.map(line => '  ' + line).join('\n');
  }

}
