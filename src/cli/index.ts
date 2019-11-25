import { red } from 'chalk';
import * as commander from 'commander';
import { TestingModule } from '../public-api';

export class Cli {
  private testingModule: TestingModule;

  commander = ['testing', 'Rewiring, mocking & stubbing for testing modules in Node.'];

  constructor() {
    this.testingModule = new TestingModule();
  }

  getApp() {
    const [command, description] = this.commander;
    commander
      .version(require('../../package.json').version, '-v, --version')
      .usage(`${command} [options] [command]`)
      .description(description);

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
