// tslint:disable: no-any ban-ts-ignore
export type MockedValue = Function | string | number | boolean | {} | any[];

export type MockedReturns = '*' | MockedValue;

export type MockedModule<Methods> = {
  [member in keyof Methods]?: MockedReturns;
};

export type MockedService<Methods> = {
  [method in keyof Methods]?: MockedReturns;
};

export class MockBuilder<
  Methods,
  ReturnsKeeper extends {
    [name in keyof Methods]: MockedReturns;
  },
  ArgsKeeper extends {
    [name in keyof Methods]: any[];
  },
  StackedArgsKeeper extends {
    [name in keyof Methods]: any[][];
  }
> {

  private returnsKeeper: ReturnsKeeper;
  private argsKeeper: ArgsKeeper = {} as ArgsKeeper;
  private stackedArgsKeeper: StackedArgsKeeper = {} as StackedArgsKeeper;

  constructor(methods: Methods) {
    // set returns
    this.returnsKeeper = methods as any;
    // register methods
    for (const name of Object.keys(methods)) {
      const methodName = name as keyof Methods;
      // @ts-ignore
      this[methodName] = (...args: any[]) => {
        // set args
        this.argsKeeper[methodName] = args as any;
        // set args stack
        if (!this.stackedArgsKeeper[methodName]) {
          this.stackedArgsKeeper[methodName] = [args] as any;
        } else {
          this.stackedArgsKeeper[methodName].push(args);
        }
        // returns
        const returns = this.returnsKeeper[methodName];
        if (returns === '*') {
          return this;
        } else if (returns instanceof Function) {
          return (returns as Function)();
        } else {
          return returns;
        }
      };
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
   * Get the raw value defined for a method to return
   *
   * `NOTE`: **DO NOT** use this for testing purpose
   * @param method - The method name
   */
  getReturns(method: keyof Methods) {
    return !!this.returnsKeeper ? this.returnsKeeper[method] : undefined;
  }

  /**
   * Get the returned value of a method
   * 
   * `NOTE`: **DO NOT** use this for testing purpose
   * @param method - The method name
   */
  getReturnsResult(method: keyof Methods) {
    const returns = this.getReturns(method);
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
   * @param method - The method name
   */
  getArgs(method: keyof Methods) {
    return !!this.argsKeeper ? this.argsKeeper[method] : [];
  }

  /**
   * Get an arg by paramter position
   * @param method - The method name
   * @param position - The param position
   */
  getArg(method: keyof Methods, position = 1) {
    const args = this.getArgs(method);
    return args[position - 1];
  }

  /**
   * Get the first arg
   * @param method - The method name
   */
  getArgFirst(method: keyof Methods) {
    return this.getArg(method, 1);
  }
  
  /**
   * Get the second arg
   * @param method - The method name
   */
  getArgSecond(method: keyof Methods) {
    return this.getArg(method, 2);
  }

  /**
   * Get the third arg
   * @param method - The method name
   */
  getArgThird(method: keyof Methods) {
    return this.getArg(method, 3);
  }

  /**
   * Get a list of stacked args
   * @param method - The method name
   */
  getStackedArgs(method: keyof Methods) {
    return !!this.stackedArgsKeeper ? this.stackedArgsKeeper[method] : [];
  }

  /**
   * Get a list of args by execution order
   * @param method - The method name
   * @param execution - The execution order
   */
  getStackedArgsChild(method: keyof Methods, execution = 1) {
    const stackedArgs = this.getStackedArgs(method);
    return stackedArgs[execution - 1] || [];
  }

  /**
   * Get a list of args of the first execution
   * @param method - The method name
   */
  getStackedArgsChildFirst(method: keyof Methods) {
    return this.getStackedArgsChild(method, 1);
  }

  /**
   * Get a list of args of the second execution
   * @param method - The method name
   */
  getStackedArgsChildSecond(method: keyof Methods) {
    return this.getStackedArgsChild(method, 2);
  }

  /**
   * Get a list of args of the third execution
   * @param method - The method name
   */
  getStackedArgsChildThird(method: keyof Methods) {
    return this.getStackedArgsChild(method, 3);
  }

  /**
   * Get an arg by execution order and parameter position
   * @param method - The method name
   * @param execution - The execution order
   * @param position - The param position
   */
  getArgInStack(
    method: keyof Methods,
    execution = 1,
    position = 1,
  ) {
    const childArgs = this.getStackedArgsChild(method, execution);
    return childArgs[position - 1];
  }

  /**
   * Get the first arg of the first execution
   * @param method - The method name
   */
  getArgInStackAt1X1(method: keyof Methods) {
    return this.getArgInStack(method, 1, 1);
  }

  /**
   * Get the second arg of the first execution
   * @param method - The method name
   */
  getArgInStackAt1X2(method: keyof Methods) {
    return this.getArgInStack(method, 1, 2);
  }

  /**
   * Get the third arg of the first execution
   * @param method - The method name
   */
  getArgInStackAt1X3(method: keyof Methods) {
    return this.getArgInStack(method, 1, 3);
  }

  /**
   * Get the first arg of the second execution
   * @param method - The method name
   */
  getArgInStackAt2X1(method: keyof Methods) {
    return this.getArgInStack(method, 2, 1);
  }

  /**
   * Get the second arg of the second execution
   * @param method - The method name
   */
  getArgInStackAt2X2(method: keyof Methods) {
    return this.getArgInStack(method, 2, 2);
  }

  /**
   * Get the third arg of the second execution
   * @param method - The method name
   */
  getArgInStackAt2X3(method: keyof Methods) {
    return this.getArgInStack(method, 2, 3);
  }

  /**
   * Get the first arg of the third execution
   * @param method - The method name
   */
  getArgInStackAt3X1(method: keyof Methods) {
    return this.getArgInStack(method, 3, 1);
  }

  /**
   * Get the second arg of the third execution
   * @param method - The method name
   */
  getArgInStackAt3X2(method: keyof Methods) {
    return this.getArgInStack(method, 3, 2);
  }

  /**
   * Get the third arg of the third execution
   * @param method - The method name
   */
  getArgInStackAt3X3(method: keyof Methods) {
    return this.getArgInStack(method, 3, 3);
  }

}
