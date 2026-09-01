# @thspian/circuul-core

Framework-agnostic Circuul HTTP client for Thspian UGC CPA attribution (app install + web visit).

Used by `@thspian/circuul-react` and `@thspian/circuul-react-native`. You can also call it directly from Node or plain browser JS.

---

## Before you install

1. On **[thspian.com](https://thspian.com)**, create a UGC campaign with **app install** (or **web visit**) CPA enabled.
2. Sync / open Circuul settings for that campaign and copy your **app token** (`cat_…`).
3. Store that token in your app config — you pass it into every Circuul client.

Without a campaign and `cat_…` token, attribution will not work.

---

## Install

```bash
npm install @thspian/circuul-core
```

Requires **Node 18+** (uses global `fetch`).

---

## Quick start

```js
import { createClient, extractCodeFromSearch } from '@thspian/circuul-core';
// or: const { createClient } = require('@thspian/circuul-core');

const circuul = createClient({
  appToken: 'cat_…', // from your Thspian campaign
  apiBase: 'https://api.thspian.com/api/v1',
});

// Web visit (landing page)
const visit = await circuul.visitConfirm({
  code: extractCodeFromSearch(window.location.search),
});

// App install (native / RN first open)
const match = await circuul.match({
  platform: 'ios',
  install_id: 'persistent-device-uuid',
  code: 'CREATOR_CODE', // optional if Play Referrer / fingerprint can resolve
});
```

Both `match` and `visitConfirm` **always resolve** — they never throw. Check `result.attributed`.

---

## API

### `createClient({ appToken, apiBase })`

| Option | Required | Description |
|--------|----------|-------------|
| `appToken` | yes | Campaign token from Thspian (`cat_…`) |
| `apiBase` | yes | Thspian API base, e.g. `https://api.thspian.com/api/v1` |

Returns:

| Method | Use |
|--------|-----|
| `match(payload)` | First open after install — credits install CPA |
| `visitConfirm(payload)` | Landing page load — credits web-visit CPA (sends `app_token`) |
| `recordClick(payload)` | Optional explicit click record |

### `extractCodeFromSearch(search)`

Reads `circuul_ref`, `ref`, `circuul`, `code`, or `utm_content` from a query string.

### `shouldPersistMatched(result)`

Helper for SDKs: whether a result is terminal (safe to mark “already tried”).

---

## Result shape

```ts
{
  attributed: boolean;
  reason?: string;
  code?: string;
  cpa_cents?: number;
  duplicate?: boolean;
}
```

Common `reason` values: `unmatched`, `already_matched`, `invalid_app_token`, `invalid_code`, `code_app_mismatch`, `rate_limited`, `network_error`.

---

## Related packages

- [`@thspian/circuul-react`](https://www.npmjs.com/package/@thspian/circuul-react) — React / Next.js
- [`@thspian/circuul-react-native`](https://www.npmjs.com/package/@thspian/circuul-react-native) — React Native / Expo

Docs: [thspian.com](https://thspian.com)
