Install globaly, as a CLI:

`npm install -g @lamnhan/testea`

Or localy:

`npm install --save-dev @lamnhan/testea`

Use the library:

```ts
import { mockService } from '@lamnhan/testea';

const mocked = mockService({
  a: () => 1,
  b: async () => 2,
});

// test begins
```
