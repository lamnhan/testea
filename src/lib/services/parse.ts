// tslint:disable: no-any
import { resolve } from 'path';
import { readFile, pathExistsSync } from 'fs-extra';
import * as recursiveReaddir from 'recursive-readdir';
import { ParseService as AyedocsParseService, Declaration } from '@lamnhan/ayedocs';

export interface ParsedItem extends ParsedData {
  path: string;
  content: string;
}

export interface ParsedData {
  imports: ParsedImport[];
  classes: ParsedClass[];
}

export interface ParsedImport {
  statement: string;
  type: ImportType;
  value: string | string[];
  from: string;
  source: ImportSource;
}

export interface ParsedClass {
  name: string;
  declaration: Declaration;
  properties: Declaration[];
  constructorParams: Array<{ name: string, type: string }>;
  methods: Declaration[];
}

export type ImportType = 'default' | 'name' | 'full';

export type ImportSource = 'local' | 'node' | 'global';

export class ParseService {

  constructor (
    private parseService: AyedocsParseService
  ) {}

  async parse(source = 'src') {
    const result: ParsedItem[] = [];
    // get files
    const files = await this.readFiles(source);
    // extract data
    for (let i = 0; i < files.length; i++) {
      const path = files[i];
      const content = await readFile(resolve(path), 'utf8');
      const data = this.extractData(content);
      if (!!data) {
        result.push({ path, content, ...data });
      }
    }
    // result
    return result;
  }

  private async readFiles(dir: string) {
    return recursiveReaddir(resolve(dir), ['*.md', '*.js', '*.map', '*.d.ts']);
  }

  private extractData(content: string) {
    const classMatched = content.match(/export\ class\ .*\ {/g);
    // no class
    if (!classMatched) {
      return null;
    }
    // get imports
    const imports = (content.match(/import\ .*\ from\ .*;/g) || [])
      .map(item => {
        const [, value, path] = ((/import\ (.*)\ from\ (.*);/).exec(item) || []);
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
            .map(x => x.trim().replace(/\ as\ .*/g, ''));
        } else {
          importType = 'default';
          importValue = value.trim();
        }
        // get path
        const importFrom = path.replace(/\'|\"/g, '');
        // path type
        let importSource: ImportSource;
        if (importFrom.indexOf('./') !== -1 || importFrom.indexOf('../') !== -1) {
          importSource = 'local';
        } else if (pathExistsSync(resolve('node_modules', importFrom))) {
          importSource = 'node';
        } else {
          importSource = 'global';
        }
        // result
        return {
          statement: item,
          type: importType,
          value: importValue,
          from: importFrom,
          source: importSource
        } as ParsedImport;
      });
    
    // get classes
    const classes = classMatched
      .map(item => {
        const name = ((/export\ class\ (.*)\ {/).exec(item) || []).pop() as string;
        const declaration = this.parseService.parse(name);
        const properties = declaration.getVariablesOrProperties();
        const methods = declaration.getFunctionsOrMethods();
        // constructor params
        const {
          REFLECTION: constructorReflection
        } = declaration.getChild('constructor');
        const constructorSignature = (constructorReflection as any)['signatures'][0];
        const constructorParams = (constructorSignature.parameters || [])
          .map((param: any) => ({
            name: param.name,
            type: param.type.toString()
          }));
        // result
        return {
          name,
          declaration,
          properties,
          constructorParams,
          methods,
        } as ParsedClass;
      });
    // result
    return { imports, classes } as ParsedData;
  }

}
