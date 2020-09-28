import {AyedocsModule} from '@lamnhan/ayedocs';

import {ParseService} from './services/parse.service';
import {TemplateService} from './services/template.service';
import {RenderService} from './services/render.service';

export class Lib {
  private ayedocsModule: AyedocsModule;
  parseService: ParseService;
  templateService: TemplateService;
  renderService: RenderService;

  constructor() {
    this.ayedocsModule = new AyedocsModule({
      typedocConfigs: {
        excludePrivate: false,
        excludeProtected: false,
      },
    });
    this.parseService = new ParseService(this.ayedocsModule.parseService);
    this.templateService = new TemplateService();
    this.renderService = new RenderService(this.templateService);
  }
}
