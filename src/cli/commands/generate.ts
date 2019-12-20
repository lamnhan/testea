import { resolve } from 'path';
import { outputFile, pathExists } from 'fs-extra';
import { green, blue } from 'chalk';
import { ParseService, RenderService } from '../../public-api';

export class GenerateCommand {
  constructor(
    private parseService: ParseService,
    private renderService: RenderService
  ) {}

  async run() {
    const parsedItems = await this.parseService.parse();
    for (let i = 0; i < parsedItems.length; i++) {
      const item = parsedItems[i];
      // path
      const path = ('test' +
        item.path
          .replace(/\\/g, '/')
          .replace('.ts', '.spec.ts')
          .split('src')
          .pop()) as string;
      const fullPath = resolve(path);
      // save content
      if (await pathExists(fullPath)) {
        console.log('Spec file exists at ' + blue(path));
      } else {
        // render content
        const content = await this.renderService.render(item);
        // save file
        await outputFile(fullPath, content);
        console.log('Spec file saved at ' + green(path));
      }
    }
  }
}
