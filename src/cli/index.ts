import { red } from 'chalk';
import * as commander from 'commander';
import { TesteaModule } from '../public-api';

import { GenerateCommand } from './commands/generate';

export class Cli {
  private testeaModule: TesteaModule;

  generateCommand: GenerateCommand;

  commander = ['testea', 'Spec file generate, ...'];

  generateCommandDef: CommandDef = ['generate', 'Generate spec files.'];

  constructor() {
    this.testeaModule = new TesteaModule();
    this.generateCommand = new GenerateCommand(
      this.testeaModule.parseService,
      this.testeaModule.renderService
    );
  }

  getApp() {
    const [command, description] = this.commander;
    commander
      .version(require('../../package.json').version, '-v, --version')
      .usage(`${command} [options] [command]`)
      .description(description);

    // generate
    (() => {
      const [command, description] = this.generateCommandDef;
      commander
        .command(command)
        .description(description)
        .action(() => this.generateCommand.run());
    })();

    // help
    commander
      .command('help')
      .description('Display help.')
      .action(() => commander.outputHelp());

    // *
    commander
      .command('*')
      .description('Any other command is not supported.')
      .action((cmd: string) => console.error(red(`Unknown command '${cmd}'`)));

    return commander;
  }
}

type CommandDef = [string, string, ...Array<[string, string]>];
