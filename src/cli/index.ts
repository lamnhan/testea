import { red } from 'chalk';
import * as commander from 'commander';
import { TestingModule } from '../public-api';

import { GenerateCommand } from './commands/generate';

export class Cli {
  private testingModule: TestingModule;

  private generateCommand: GenerateCommand;

  commander = ['testing', 'Rewiring, mocking & stubbing for testing modules in Node.'];

  generateCommandDef: CommandDef = [
    'generate', 'Generate spec files.'
  ];

  constructor() {
    this.testingModule = new TestingModule();
    this.generateCommand = new GenerateCommand(
      this.testingModule.Parse,
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
      const [ command, description ] = this.generateCommandDef;
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
      .action((cmd: string) =>
        console.error(red(`Unknown command '${cmd}'`))
      );

    return commander;
  }

}

type CommandDef = [string, string, ...Array<[string, string]>];
