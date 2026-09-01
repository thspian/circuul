# @thspian/circuul-react

Circuul helpers for **React**, **Next.js**, Vite, and CRA. Credits creators for **web visits**, or stamps a referral code on a landing page before an **app install**.

---

## Before you install

1. On **[thspian.com](https://thspian.com)**, create a UGC campaign with Circuul CPA enabled (`app_install` or `web_visit`).
2. Copy your campaign **app token** — it starts with `cat_…`.
3. Pass that token into `init({ appToken: 'cat_…', … })`.

The SDK cannot attribute anything without a Thspian campaign and `cat_…` token.

---

## Install

```bash
npm install @thspian/circuul-react
```

Peer dependency: `react` ≥ 17.

---

## Web visit campaigns

Use this on the brand site that creators send traffic to. Call `init` once on page load.

```js
import { useEffect } from 'react';
import { init } from '@thspian/circuul-react';

function App() {
  useEffect(() => {
    init({
      appToken: 'cat_…', // from thspian.com campaign
      apiBase: 'https://api.thspian.com/api/v1',
      kind: 'web_visit',
    }).then((result) => {
      console.log('[Circuul]', result);
      // { attributed: true, code: 'ABCD1234', cpa_cents: 75 }
    });
  }, []);

  return /* your app */;
}
```

### Next.js (`pages/_app.js` or App Router client component)

```js
'use client';

import { useEffect } from 'react';
import { init } from '@thspian/circuul-react';

export default function Providers({ children }) {
  useEffect(() => {
    init({
      appToken: process.env.NEXT_PUBLIC_CIRCUUL_APP_TOKEN,
      apiBase: process.env.NEXT_PUBLIC_THSPIAN_API_BASE,
      kind: 'web_visit',
    });
  }, []);

  return children;
}
```

Flow: creator link → Thspian redirect adds `?circuul_ref=CODE` → your site loads → `visitConfirm` credits CPA.

---

## App install campaigns (web landing only)

On a smart-banner / store redirect page, Circuul **only stores** the referral code. It does **not** call `match()` in the browser (install CPA is paid when the **app** opens).

```js
init({
  appToken: 'cat_…',
  apiBase: 'https://api.thspian.com/api/v1',
  kind: 'app_install',
});
// → { attributed: false, reason: 'code_stored', code: 'ABCD1234' }
```

Wrap the native app with `@thspian/circuul-react-native` (or Swift/Kotlin) using the **same** `cat_…` token.

---

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `appToken` | `string` | required | Campaign token from Thspian (`cat_…`) |
| `apiBase` | `string` | required | e.g. `https://api.thspian.com/api/v1` |
| `kind` | `'web_visit' \| 'app_install'` | `'web_visit'` | Campaign type |
| `autoConfirm` | `boolean` | `true` | Skip API call when `false` (web_visit only) |
| `search` | `string` | `window.location.search` | Override query string |

---

## Helpers

```js
import { getStoredCode, extractCodeFromSearch, createClient } from '@thspian/circuul-react';
```

- `getStoredCode()` — last stamped referral code in `localStorage`
- `extractCodeFromSearch(search)` — parse code from a query string
- `createClient(...)` — low-level client from `@thspian/circuul-core`

`init` never throws. Network failures leave the device unmarked so the next load can retry.

---

## Related

- [`@thspian/circuul-core`](https://www.npmjs.com/package/@thspian/circuul-core)
- [`@thspian/circuul-react-native`](https://www.npmjs.com/package/@thspian/circuul-react-native)

Create campaigns: [thspian.com](https://thspian.com)
