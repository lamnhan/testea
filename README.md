<section id="head" data-note="AUTO-GENERATED CONTENT, DO NOT EDIT DIRECTLY!">

# @lamnhan/testing

**Rewiring, mocking & stubbing for testing modules in Node.**

</section>

<section id="header">

[![License][license_badge]][license_url] [![Support me on Patreon][patreon_badge]][patreon_url] [![PayPal][paypal_donate_badge]][paypal_donate_url] [![Ask me anything][ask_me_badge]][ask_me_url]

[license_badge]: https://img.shields.io/github/license/mashape/apistatus.svg
[license_url]: https://github.com/lamnhan/testing/blob/master/LICENSE
[patreon_badge]: https://lamnhan.github.io/assets/images/badges/patreon.svg
[patreon_url]: https://www.patreon.com/lamnhan
[paypal_donate_badge]: https://lamnhan.github.io/assets/images/badges/paypal_donate.svg
[paypal_donate_url]: https://www.paypal.me/lamnhan
[ask_me_badge]: https://img.shields.io/badge/ask/me-anything-1abc9c.svg
[ask_me_url]: https://m.me/lamhiennhan

</section>

<section id="installation" data-note="AUTO-GENERATED CONTENT, DO NOT EDIT DIRECTLY!">

Install globaly, as a CLI:

`npm install -g @lamnhan/testing`

Or localy:

`npm install --save-dev @lamnhan/testing`

Use the library:

```ts
import { mockService } from "@lamnhan/testing";

const mocked = mockService({
  a: () => 1,
  b: async () => 2
});

// test begins
```

</section>

<section id="docs">

See the documentation at: <http://lamnhan.com/testing>

</section>

<section id="license" data-note="AUTO-GENERATED CONTENT, DO NOT EDIT DIRECTLY!">

## License

**@lamnhan/testing** is released under the [MIT](https://github.com/lamnhan/testing/blob/master/LICENSE) license.

</section>
