// tslint:disable: no-any ban-ts-ignore
export type MockedValue = Function | string | number | boolean | {} | any[];

export type Mocking<Members> = {
  [member in keyof Members]?: MockedValue;
}

export type ModuleMocking<Members> = Mocking<Members>;

export type ServiceMocking<Members> = Mocking<Members>;

type ReturnsKeeping<Members> = {
  [member in keyof Members]: MockedValue;
}

type ArgsKeeping<Members> = {
  [member in keyof Members]: any[];
}

type StackedArgsKeeping<Members> = {
  [member in keyof Members]: any[][];
}

type CalledKeeping<Members> = {
  [member in keyof Members]: number;
}

export class MockBuilder<
  Members,
  ReturnsKeeper extends ReturnsKeeping<Members>,
  ArgsKeeper extends ArgsKeeping<Members>,
  StackedArgsKeeper extends StackedArgsKeeping<Members>,
  CalledKeeper extends CalledKeeping<Members>
> {

  private returnsKeeper: ReturnsKeeper;
  private argsKeeper: ArgsKeeper = {} as ArgsKeeper;
  private stackedArgsKeeper: StackedArgsKeeper = {} as StackedArgsKeeper;
  private calledKeeper: CalledKeeper = {} as CalledKeeper;

  constructor(members: Members) {
    // set returns
    this.returnsKeeper = members as any;
    // register members
    for (const name of Object.keys(members)) {
      const memberName = name as keyof Members;
      const returns = this.returnsKeeper[memberName];
      // a prop
      if (name.substr(0, 1) === '.') {
        // @ts-ignore
        this[name.substr(1)] = returns;
      }
      // a method
      else {
        // @ts-ignore
        this[memberName] = (...args: any[]) => {
          // set args
          this.argsKeeper[memberName] = args as any;
          // set args stack
          if (!this.stackedArgsKeeper[memberName]) {
            this.stackedArgsKeeper[memberName] = [args] as any;
          } else {
            this.stackedArgsKeeper[memberName].push(args);
          }
          // set called
          if (!this.calledKeeper[memberName]) {
            this.calledKeeper[memberName] = 1 as any;
          } else {
            this.calledKeeper[memberName]++;
          }
          // returns
          if (returns === '*') {
            return this;
          } else if (returns === '.!') {
            return Promise.resolve(args[0]);
          } else if (returns === '.') {
            return args[0];
          } else if (returns === '...!') {
            return Promise.resolve(args);
          } else if (returns === '...') {
            return args;
          } else if (returns instanceof Function) {
            return (returns as Function)(...args);
          } else {
            return returns;
          }
        };
      }
    }
  }

  /**
   * Get a mocked property value
   * @param prop - The prop name
   */
  getProp(prop: string) {
    // @ts-ignore
    return this[prop];
  }

  /**
   * Get the result for a certain member
   */
  getResult(member: keyof Members) {
    const args = !!this.argsKeeper ? this.argsKeeper[member] : [];
    const stackedArgs = !!this.stackedArgsKeeper ? this.stackedArgsKeeper[member] : [];
    const called = this.calledKeeper[member] || 0;
    return new MockedResult(args, stackedArgs, called);
  }

  /**
   * Get all the data holded by the Returns Keeper
   */
  getAllReturns() {
    return this.returnsKeeper;
  }  

  /**
   * Get all the data holded by the Args Keeper
   */
  getAllArgs() {
    return this.argsKeeper;
  }

  /**
   * Get all the data holded by the StackedArgs Keeper
   */
  getAllStackedArgs() {
    return this.stackedArgsKeeper;
  }

}

export class MockedResult {

  args: any[] = [];
  stackedArgs: any[] = [[]];
  called = 0;

  constructor(args: any[], stackedArgs: any[], called: number) {
    this.args = args || [];
    this.stackedArgs = stackedArgs || [[]];
    this.called = called || 0;
  }

  /**
   * Get a list of args
   */
  getArgs() {
    return this.args;
  }

  /**
   * Get the number of args
   */
  countArgs() {
    return this.args.length;
  }

  /**
   * Get an arg by paramter position
   * @param position - The param position
   */
  getArg(position = 1) {
    const args = this.getArgs();
    return args[position - 1];
  }

  /**
   * Get the first arg
   */
  getArgFirst() {
    return this.getArg(1);
  }
  
  /**
   * Get the second arg
   */
  getArgSecond() {
    return this.getArg(2);
  }

  /**
   * Get the third arg
   */
  getArgThird() {
    return this.getArg(3);
  }

  /**
   * Get the last arg
   */
  getArgLast() {
    return this.args[this.countArgs() - 1];
  }

  /**
   * Get a list of stacked args
   */
  getStackedArgs() {
    return this.stackedArgs;
  }

  /**
   * Get the number of stacked args
   */
  countStackedArgs() {
    return this.stackedArgs.length;
  }

  /**
   * Get a list of args by execution order
   * @param execution - The execution order
   */
  getStackedArgsChild(execution = 1) {
    return this.stackedArgs[execution - 1] || [];
  }

  /**
   * Get a list of args of the first execution
   */
  getStackedArgsFirst() {
    return this.getStackedArgsChild(1);
  }

  /**
   * Get a list of args of the second execution
   */
  getStackedArgsSecond() {
    return this.getStackedArgsChild(2);
  }

  /**
   * Get a list of args of the third execution
   */
  getStackedArgsThird() {
    return this.getStackedArgsChild(3);
  }

  /**
   * Get a list of args of the last execution
   */
  getStackedArgsLast() {
    return this.stackedArgs[this.countStackedArgs() - 1];
  }

  /**
   * Get an arg by execution order and parameter position
   * @param execution - The execution order
   * @param position - The param position
   */
  getArgInStack(execution = 1, position = 1) {
    const childArgs = this.getStackedArgsChild(execution);
    return childArgs[position - 1];
  }

  /**
   * See if a method have been called
   */
  haveBeenCalled() {
    return !!this.called;
  }

  /**
   * See if a method have been called with certain args
   * @param args - The list of arguments
   */
  haveBeenCalledWith(...args: any[]) {
    return JSON.stringify(this.args) === JSON.stringify(args);
  }

  /**
   * Get the number of call
   */
  callCount() {
    return this.called;
  }

}
