import { ParseService } from '../../public-api';

export class GenerateCommand {

  constructor (private parseService: ParseService) {}

  async run() {
    const result = await this.parseService.parse();
  }

}
