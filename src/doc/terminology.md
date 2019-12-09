## `Module` and `mocked module`

A **module** is a dependency or a file that is imported by your code. Example: `path` module, `module1` module, ...

```ts
import { resolve } from 'path';
import { something } from './module1';
```

There are 3 kinds of module:

- **Native**: Node builtin modules
- **Installed**: installed `node_modules/` dependencies
- **Local**: any files in the `src/` folder

A **mocked module** is a module that was created to replace the original module for testea purpose.

## `Service` and `mocked service`

A **service** is an exported member of a **module**, usually an exported `class` in a module. Example: `MyService` service, `AnotherService` service, ...

```ts
import { MyService } from './module1';
import { AnotherService } from './module2';
```

A **mocked service** is a service that was created to replace the original service for testea purpose.

## `Stub`

**Stubbing** is an action that replace a **method** of a **server** with a mocked one. Stubbing is useful when a method depends on other methods within the same service.

```ts
class MyService {

  a() {
    return 1;
  }

  b() {
    const useTheAMethod = this.a();
    return 2;
  }

}
```

When testea the `b()` method, we can  set the `a()` method to returns whatever we want without actually calling it.
