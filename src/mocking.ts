// tslint:disable: no-any ban-ts-ignore
export type MockedValue = Function | string | number | boolean | {} | any[];

export type MockedReturns = '*' | '*.' | '.' | '*...' | '...' | MockedValue;

export type ModuleMocking<Members> = {
  [member in keyof Members]?: MockedReturns;
};

export type ServiceMocking<Members> = {
  [member in keyof Members]?: MockedReturns;
};

type ReturnsKeeping<Members> = {
  [member in keyof Members]: MockedReturns;
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
          } else if (returns === '*.') {
            return Promise.resolve(args[0]);
          } else if (returns === '.') {
            return args[0];
          } else if (returns === '*...') {
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

  /**
   * Get the raw value defined for a member to return
   *
   * `NOTE`: **DO NOT** use this for testing purpose
   * @param member - The member name
   */
  getReturns(member: keyof Members) {
    return !!this.returnsKeeper ? this.returnsKeeper[member] : undefined;
  }

  /**
   * Get the returned value of a member
   * 
   * `NOTE`: **DO NOT** use this for testing purpose
   * @param member - The member name
   */
  getReturnsResult(member: keyof Members) {
    const returns = this.getReturns(member);
    if (returns === '*') {
      return this;
    } else if (returns instanceof Function) {
      return (returns as Function)();
    } else {
      return returns;
    }
  }

  /**
   * Get a list of args
   * @param member - The member name
   */
  getArgs(member: keyof Members) {
    return !!this.argsKeeper ? this.argsKeeper[member] : [];
  }

  /**
   * Get an arg by paramter position
   * @param member - The member name
   * @param position - The param position
   */
  getArg(member: keyof Members, position = 1) {
    const args = this.getArgs(member);
    return args[position - 1];
  }

  /**
   * Get the first arg
   * @param member - The member name
   */
  getArgFirst(member: keyof Members) {
    return this.getArg(member, 1);
  }
  
  /**
   * Get the second arg
   * @param member - The member name
   */
  getArgSecond(member: keyof Members) {
    return this.getArg(member, 2);
  }

  /**
   * Get the third arg
   * @param member - The member name
   */
  getArgThird(member: keyof Members) {
    return this.getArg(member, 3);
  }

  /**
   * Get the last arg
   * @param member - The member name
   */
  getArgLast(member: keyof Members) {
    const args = this.getArgs(member);
    return args[args.length - 1];
  }

  /**
   * Get a list of stacked args
   * @param member - The member name
   */
  getStackedArgs(member: keyof Members) {
    return !!this.stackedArgsKeeper ? this.stackedArgsKeeper[member] : [];
  }

  /**
   * Get a list of args by execution order
   * @param member - The member name
   * @param execution - The execution order
   */
  getStackedArgsChild(member: keyof Members, execution = 1) {
    const stackedArgs = this.getStackedArgs(member);
    return stackedArgs[execution - 1] || [];
  }

  /**
   * Get a list of args of the first execution
   * @param member - The member name
   */
  getStackedArgsFirst(member: keyof Members) {
    return this.getStackedArgsChild(member, 1);
  }

  /**
   * Get a list of args of the second execution
   * @param member - The member name
   */
  getStackedArgsSecond(member: keyof Members) {
    return this.getStackedArgsChild(member, 2);
  }

  /**
   * Get a list of args of the third execution
   * @param member - The member name
   */
  getStackedArgsThird(member: keyof Members) {
    return this.getStackedArgsChild(member, 3);
  }

  /**
   * Get a list of args of the last execution
   * @param member - The member name
   */
  getStackedArgsLast(member: keyof Members) {
    const stackedArgs = this.getStackedArgs(member);
    return stackedArgs[stackedArgs.length - 1];
  }

  /**
   * Get an arg by execution order and parameter position
   * @param member - The member name
   * @param execution - The execution order
   * @param position - The param position
   */
  getArgInStack(
    member: keyof Members,
    execution = 1,
    position = 1,
  ) {
    const childArgs = this.getStackedArgsChild(member, execution);
    return childArgs[position - 1];
  }

  /**
   * See if a method have been called
   * @param member - The member name
   */
  haveBeenCalled(member: keyof Members) {
    return !!this.calledKeeper[member];
  }

  /**
   * See if a method have been called with certain args
   * @param member - The member name
   * @param args - The list of arguments
   */
  haveBeenCalledWith(member: keyof Members, ...args: any[]) {
    const methodArgs = this.getArgs(member);
    const equalArgs = !methodArgs ? false : JSON.stringify(methodArgs) === JSON.stringify(args);
    return equalArgs;
  }

  /**
   * Get the number of call
   * @param member - The member name
   */
  callCount(member: keyof Members) {
    return this.calledKeeper[member] || 0;
  }

}
