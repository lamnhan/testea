Install globaly, as a CLI:

`npm install -g @lamnhan/testing`

Or localy:

`npm install --save-dev @lamnhan/testing`

Use the library:

```ts
import { mockService } from '@lamnhan/testing';

const mocked = mockService({
  a: () => 1,
  b: async () => 2,
});

// test begins
```
