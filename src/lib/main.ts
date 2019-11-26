import { ayedocs, AyedocsModule } from '@lamnhan/ayedocs';
import { ParseService } from './services/parse';
import { TemplateService } from './services/template';
import { RenderService } from './services/render';

export class Main {
  private ayedocsModule: AyedocsModule;
  private parseService: ParseService;
  private templateService: TemplateService;
  private renderService: RenderService;

  constructor() {
    this.ayedocsModule = ayedocs({
      typedocConfigs: {
        excludePrivate: false,
        excludeProtected: false
      }
    });
    this.parseService = new ParseService(
      this.ayedocsModule.Parse
    );
    this.templateService = new TemplateService();
    this.renderService = new RenderService(
      this.templateService
    );
  }

  get Parse() {
    return this.parseService;
  }

  get Template() {
    return this.templateService;
  }

  get Render() {
    return this.renderService;
  }

}
