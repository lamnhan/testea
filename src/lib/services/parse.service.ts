import {resolve} from 'path';
import {readFile, pathExistsSync} from 'fs-extra';
import * as recursiveReaddir from 'recursive-readdir';
import {
  ParseService as AyedocsParseService,
  Declaration,
} from '@lamnhan/ayedocs';

export interface ParsedItem extends ParsedData, ParsedFlags {
  path: string;
  content: string;
}

export interface ParsedData {
  imports: ParsedImport[];
  moduleImports: ParsedImport[];
  serviceImports: ParsedImport[];
  classes: ParsedClass[];
}

export interface ParsedFlags {
  hasModuleMocks?: boolean;
  hasServiceMocks?: boolean;
}

export interface ParsedImport {
  statement: string;
  type: ImportType;
  value: string | string[];
  from: string;
  source: ImportSource;
  id: string;
}

export interface ParsedClass {
  name: string;
  declaration: Declaration;
  properties: Declaration[];
  methods: Declaration[];
  constructorParams: ClassParam[];
  parameters: ClassParam[];
  injectedServices: ClassParam[];
}

export interface ClassParam {
  name: string;
  type: string;
}

export type ImportType = 'default' | 'name' | 'full';

export type ImportSource = 'local' | 'node' | 'global';

export class ParseService {
  constructor(private ayedocsParseService: AyedocsParseService) {}

  async parse(source = 'src') {
    const result: ParsedItem[] = [];
    // get files
    const files = await this.readFiles(source);
    // extract data
    for (let i = 0; i < files.length; i++) {
      const path = files[i];
      const content = await readFile(resolve(path), 'utf8');
      const data = this.extractData(content);
      if (data) {
        result.push({path, content, ...data});
      }
    }
    // result
    return result;
  }

  private async readFiles(dir: string) {
    return recursiveReaddir(resolve(dir), ['*.md', '*.js', '*.map', '*.d.ts']);
  }

  private extractData(content: string) {
    const classMatched = content.match(/export class .*[<|( {)]/g);
    // no class
    if (!classMatched) {
      return null;
    }
    // get imports
    const aliasNameImports: {[name: string]: string} = {};
    const imports = (content.match(/import .* from .*;/g) || [])
      .map(item => {
        const [, value, path] = /import (.*) from (.*);/.exec(item) || [];
        // get type & values
        let importType: ImportType;
        let importValue: string | string[];
        if (value.charAt(0) === '*') {
          importType = 'full';
          importValue = value.replace('* as ', '');
        } else if (value.charAt(0) === '{') {
          importType = 'name';
          importValue = value
            .replace(/\{|\}/g, '')
            .split(',')
            .map(x => {
              const [name, alias] = x.split(' as ').map(x2 => x2.trim());
              if (alias) {
                aliasNameImports[alias] = name;
              }
              return name;
            })
            .filter(name => {
              let declaration: undefined | Declaration;
              try {
                declaration = this.ayedocsParseService.parse(name);
              } catch (error) {
                // no declaration
              }
              // must be a var/function/class
              return (
                !declaration ||
                declaration.isKind('Variable') ||
                declaration.isKind('Function') ||
                declaration.isKind('Class')
              );
            });
        } else {
          importType = 'default';
          importValue = value.trim();
        }
        // get path
        const importFrom = path.replace(/'|"/g, '');
        // path type
        let importSource: ImportSource;
        if (
          importFrom.indexOf('./') !== -1 ||
          importFrom.indexOf('../') !== -1
        ) {
          importSource = 'local';
        } else if (pathExistsSync(resolve('node_modules', importFrom))) {
          importSource = 'node';
        } else {
          importSource = 'global';
        }
        // id
        const id = (importFrom.split('/').pop() as string).replace(
          /[^a-zA-Z]/g,
          ''
        );
        // result
        return {
          statement: item,
          type: importType,
          value: importValue,
          from: importFrom,
          source: importSource,
          id,
        } as ParsedImport;
      })
      .filter(({value}) => !!value.length);
    // get classes
    const allInjectedServices: {[name: string]: boolean} = {};
    const classes = classMatched.map(item => {
      const name = (((
        /export class (.*)[<|( {)]/.exec(item) || []
      ).pop() as string)
        .split('<')
        .shift() as string).trim();
      const declaration = this.ayedocsParseService.parse(name);
      const properties = declaration.getVariablesOrProperties();
      const methods = declaration.getFunctionsOrMethods();
      // constructor params
      const {REFLECTION: cstReflection} = declaration.getChild('constructor');
      const constructorSignature = (cstReflection as any)['signatures'][0];
      const injectedServices: ClassParam[] = [];
      const parameters: ClassParam[] = [];
      const constructorParams = (constructorSignature.parameters || []).map(
        (parameter: any) => {
          const type = parameter.type.toString();
          const originalType = aliasNameImports[type];
          const param = {
            name: parameter.name,
            type: originalType || type,
          };
          const isService =
            parameter.type.type === 'reference' &&
            (!parameter.type.reflection ||
              parameter.type.reflection.kindString === 'Class');
          // injected service
          if (isService) {
            injectedServices.push(param);
            allInjectedServices[param.type] = true;
          }
          // normal parameter
          else {
            parameters.push(param);
          }
          // return
          return param;
        }
      );
      // result
      return {
        name,
        declaration,
        properties,
        methods,
        constructorParams,
        injectedServices,
        parameters,
      } as ParsedClass;
    });
    // further process imports
    const moduleImports: ParsedImport[] = [];
    const serviceImports: ParsedImport[] = [];
    imports.forEach(imp => {
      if (imp.value instanceof Array) {
        const groupValue: string[] = [];
        imp.value.forEach(val => {
          if (allInjectedServices[val]) {
            serviceImports.push({...imp, value: [val]});
          } else {
            groupValue.push(val);
          }
        });
        moduleImports.push({...imp, value: groupValue});
      } else {
        moduleImports.push(imp);
      }
    });
    // result
    return {
      imports,
      moduleImports,
      serviceImports,
      classes,
      hasModuleMocks: !!moduleImports.length,
      hasServiceMocks: !!serviceImports.length,
    } as ParsedData;
  }
}
