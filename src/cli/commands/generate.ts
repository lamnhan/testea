import { resolve } from 'path';
import { outputFile } from 'fs-extra';
import { green } from 'chalk';

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
      const path = 'test' + item.path
        .replace(/\\/g, '/')
        .replace('.ts', '.spec.ts')
        .split('src')
        .pop() as string;
      // content
      const content = await this.renderService.render(item);
      // save file
      await outputFile(resolve(path), content);
      console.log('Spec file saved at ' + green(path));
    }
  }

}
