// tslint:disable: no-any ban-ts-ignore
export class MockBuilder<
  Methods,
  ReturnsKeeper extends {
    [name in keyof Methods]: '*' | Function | string | number | boolean | {} | any[];
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
    // set methods
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

  getAllArgs() {
    return this.argsKeeper;
  }

  getAllStackedArgs() {
    return this.stackedArgsKeeper;
  }

  getArgs(name: keyof Methods) {
    return !!this.argsKeeper ? this.argsKeeper[name] : [];
  }

  getArg(name: keyof Methods, position = 1) {
    const args = this.getArgs(name);
    return args[position - 1];
  }

  getStackedArgs(name: keyof Methods) {
    return !!this.stackedArgsKeeper ? this.stackedArgsKeeper[name] : [];
  }

  getStackedArgsChild(name: keyof Methods, position = 1) {
    const stackedArgs = this.getStackedArgs(name);
    return stackedArgs[position - 1] || [];
  }

  getStackedArgsGrandchild(
    name: keyof Methods,
    childPosition = 1,
    grandchildPosition = 1,
  ) {
    const childArgs = this.getStackedArgsChild(name, childPosition);
    return childArgs[grandchildPosition - 1];
  }

}
