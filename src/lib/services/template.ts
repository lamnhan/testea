import {resolve} from 'path';
import {ReflectionData} from '@lamnhan/ayedocs';

import {ParsedImport, ParsedClass} from './parse';

export class TemplateService {
  constructor() {}

  toText(strArr: string[]) {
    return strArr.join('\n');
  }

  getMetaImports(hasModuleMocks = false, hasServiceMocks = false) {
    const testeaImports: string[] = [];
    // general & main methods
    testeaImports.push('ServiceStubing');
    testeaImports.push(hasModuleMocks ? 'rewireFull' : 'rewireService');
    // has module mocks
    if (hasModuleMocks) {
      testeaImports.push('ModuleMocking', 'mockModule');
    }
    // has service mocks
    if (hasServiceMocks) {
      testeaImports.push('ServiceMocking', 'mockService');
    }
    // result
    return this.toText([
      '// tslint:disable: no-any ban-ts-ignore ban',
      "import { expect } from 'chai';",
      `import { ${testeaImports.join(', ')} } from '@lamnhan/testea';`,
    ]);
  }

  getMainInport(items: string[], path: string) {
    return `import { ${items.join(', ')} } from '${path}';`;
  }

  getModuleMock(imp: ParsedImport) {
    const {type, value, statement, id} = imp;
    let content: string[] = [];
    if (type === 'default') {
      content = [
        `// ${statement}`,
        `const ${id}ModuleDefaultMock = () => {`,
        "  return '';",
        '};',
      ];
    } else if (type === 'full') {
      content = [
        `// ${statement}`,
        `const ${id}ModuleDefaultMock = {`,
        '  // members',
        '};',
      ];
    } else {
      const members = (value as string[])
        .filter(val => {
          const firstChar = val.charAt(0);
          return (
            // not a class
            firstChar !== firstChar.toUpperCase() ||
            // whitelist class surfix
            val.substr(-7) === 'Service' ||
            val.substr(-7) === 'Command' ||
            val.substr(-6) === 'Module'
          );
        })
        .map(val => `  ${val}: '',`);
      if (!members.length) {
        members.push('  // members');
      }
      content = [
        `// ${statement}`,
        `const ${id}ModuleDefaultMock = {`,
        ...members,
        '};',
      ];
    }
    return this.toText(content);
  }

  getServiceMock(imp: ParsedImport) {
    const {statement, value} = imp;
    let name = value instanceof Array ? value[0] : value;
    name = name.charAt(0).toLowerCase() + name.substr(1);
    return this.toText([
      `// ${statement}`,
      `const ${name}DefaultMock = {`,
      '  // members',
      '};',
    ]);
  }

  getSetup(path: string, cls: ParsedClass, moduleImports?: ParsedImport[]) {
    const {name, injectedServices /*parameters*/} = cls;
    const folderPath = path.replace(/\\/g, '/').split('/');
    folderPath.pop();
    const getShortPath = (p: string) =>
      '@' +
      (p
        .replace(/\\/g, '/')
        .replace('.ts', '')
        .split('/src/')
        .pop() as string);
    // TODO: support parameters
    // const parametersArgs: string[] = [];
    // if (parameters.length) {
    // }
    // module
    const moduleMocksType: string[] = [];
    const moduleMocksParam: string[] = [];
    const moduleMocksConst: string[] = [];
    const moduleMocksArg: string[] = [];
    const moduleMockArgs: string[] = [];
    if (!!moduleImports && !!moduleImports.length) {
      moduleMocksParam.push('  moduleMocks: {');
      moduleMocksConst.push('  const {');
      moduleMocksArg.push('    {');
      moduleImports.forEach(imp => {
        const {source, from, id: name} = imp;
        const titleName = name.charAt(0).toUpperCase() + name.substr(1);
        const mockName = `${name}ModuleDefaultMock`;
        const typeName = `${titleName}ModuleMock`;
        const constName = `${name}ModuleMock`;
        const modulePath =
          source === 'local'
            ? getShortPath(resolve(...folderPath, from))
            : source === 'node'
            ? '~' + from
            : from;
        moduleMocksType.push(
          `  ${typeName} extends ModuleMocking<typeof ${mockName}>,`
        );
        moduleMocksParam.push(`    ${constName}?: ${typeName};`);
        moduleMocksConst.push(`    ${constName} = {},`);
        moduleMocksArg.push(
          `      '${modulePath}': mockModule({ ...${mockName}, ...${constName} }),`
        );
      });
      moduleMocksParam.push('  } = {},');
      moduleMocksConst.push('  } = moduleMocks;');
      moduleMocksArg.push('    },');
      // module args
      const selfPath = getShortPath(path);
      moduleMockArgs.push(
        '    // rewire the module',
        `    '${selfPath}',`,
        ...moduleMocksArg
      );
    }
    // services
    const serviceMocksType: string[] = [];
    const serviceMocksParam: string[] = [];
    const serviceMocksConst: string[] = [];
    const serviceMocksArg: string[] = [];
    if (injectedServices.length) {
      serviceMocksParam.push('  serviceMocks: {');
      serviceMocksConst.push('  const {');
      serviceMocksArg.push('    {');
      injectedServices.forEach(param => {
        const {type: titleName} = param;
        const name = titleName.charAt(0).toLowerCase() + titleName.substr(1);
        const mockName = `${name}DefaultMock`;
        const typeName = `${titleName}Mock`;
        const constName = `${name}Mock`;
        serviceMocksType.push(
          `  ${typeName} extends ServiceMocking<typeof ${mockName}>,`
        );
        serviceMocksParam.push(`    ${constName}?: ${typeName};`);
        serviceMocksConst.push(`    ${constName} = {},`);
        serviceMocksArg.push(
          `      ${constName}: mockService({ ...${mockName}, ...${constName} }),`
        );
      });
      serviceMocksParam.push('  } = {},');
      serviceMocksConst.push('  } = serviceMocks;');
      serviceMocksArg.push('    },');
    } else {
      serviceMocksArg.push('    undefined,');
    }
    // result
    const isFull = !!moduleImports && !!moduleImports.length;
    return this.toText([
      `async function setup${name}<`,
      `  SelfStubing extends ServiceStubing<${name}>,`,
      ...serviceMocksType,
      ...moduleMocksType,
      '>(',
      '  selfStubing?: SelfStubing,',
      ...serviceMocksParam,
      ...moduleMocksParam,
      ') {',
      ...serviceMocksConst,
      ...moduleMocksConst,
      `  return ${isFull ? 'rewireFull' : 'rewireService'}(`,
      ...moduleMockArgs,
      '    // rewire the service',
      `    ${name},`,
      ...serviceMocksArg,
      '    selfStubing,',
      '  ).getResult();',
      '}',
    ]);
  }

  getSuite(name: string, cases: string) {
    return this.toText(['', `describe('${name}', () => {`, cases, '', '});']);
  }

  getCaseForProperty(name: string, className: string) {
    const result: string[] = [];
    // opening
    result.push('', `it.skip('.${name}', async () => {`);
    // content
    result.push(
      `  // const { service } = await setup${className}();`,
      `  // expect(service.${name}).equal('...');`
    );
    // closing
    result.push('});');
    // result
    return this.toText(result.map(line => '  ' + line));
  }

  getCaseForMethod(
    name: string,
    params: ReflectionData[] = [],
    className: string
  ) {
    const result: string[] = [];
    // opening
    result.push('', `it.skip('${name}()', async () => {`);
    // params
    const paramList = params
      .map(({isOptional, name}) => (isOptional ? name + '?' : name))
      .join(', ');
    // content
    result.push(
      `  // const { service } = await setup${className}();`,
      `  // const result = service.${name}(${paramList});`,
      "  // expect(result).equal('...');"
    );
    // closing
    result.push('});');
    // result
    return this.toText(result.map(line => '  ' + line));
  }
}
