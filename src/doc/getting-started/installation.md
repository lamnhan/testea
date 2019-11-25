`npm install --save-dev @lamnhan/testing`

```ts
import { mockModule } from '@lamnhan/testing';

const mocked = mockModule({
  a: () => 1,
  b: async () => 2,
});

// test begins
```
