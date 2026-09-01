# @thspian/circuul-react-native

Circuul client for **React Native** and **Expo**. Call once on cold start to attribute an **app install** to a Thspian UGC creator and credit their CPA.

---

## Before you install

1. On **[thspian.com](https://thspian.com)**, create a UGC campaign with **app install** CPA enabled (store URLs, package / bundle IDs as needed).
2. Copy your campaign **app token** — it starts with `cat_…`.
3. Put that token in your app config and pass it to `Circuul.init({ appToken: 'cat_…', … })`.

Creators get unique share links from Thspian after you approve them. Without a campaign + `cat_…` token, `match` cannot attribute.

---

## Install

```bash
npm install @thspian/circuul-react-native @react-native-async-storage/async-storage
```

### Expo

```bash
npx expo install @react-native-async-storage/async-storage
```

### Bare React Native

```bash
cd ios && pod install
```

---

## Usage

Call once on cold start (root `App` / entry). Safe to fire-and-forget — never blocks launch.

```js
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Circuul } from '@thspian/circuul-react-native';

export default function App() {
  useEffect(() => {
    Circuul.init({
      appToken: 'cat_…', // from thspian.com campaign
      apiBase: 'https://api.thspian.com/api/v1',
      platform: Platform.OS, // 'ios' | 'android'
      // Prefer one of these when available:
      // code: codeFromUniversalLink,
      // androidReferrer: playInstallReferrerString,
      // idfv / gaid for stronger dedupe
    }).then((result) => {
      console.log('[Circuul]', result);
      // { attributed: true, code: 'ABCD1234', cpa_cents: 250 }
    });
  }, []);

  return /* your app */;
}
```

---

## Passing the creator code

### Universal Links / App Links

```js
const url = new URL(deepLinkUrl);
const code =
  url.searchParams.get('ref') ||
  url.searchParams.get('circuul_ref');

Circuul.init({
  appToken: 'cat_…',
  apiBase: 'https://api.thspian.com/api/v1',
  platform: Platform.OS,
  code,
});
```

### Play Install Referrer (Android)

```js
import { InstallReferrer } from 'react-native-install-referrer'; // your chosen library

const referrer = await InstallReferrer.getReferrerString();

Circuul.init({
  appToken: 'cat_…',
  apiBase: 'https://api.thspian.com/api/v1',
  platform: 'android',
  androidReferrer: referrer, // SDK / API parse utm_content
});
```

Clipboard is last resort (iOS may prompt the user).

---

## Options

| Option | Type | Description |
|--------|------|-------------|
| `appToken` | `string` | **Required.** Campaign token from Thspian (`cat_…`) |
| `apiBase` | `string` | **Required.** e.g. `https://api.thspian.com/api/v1` |
| `platform` | `string` | `'ios'` or `'android'` |
| `code` | `string` | Creator code from deep link |
| `androidReferrer` | `string` | Raw Play Install Referrer |
| `clipboardCode` | `string` | Fallback code from clipboard |
| `idfv` | `string` | iOS Identifier for Vendor |
| `gaid` | `string` | Google Advertising ID |

---

## Behaviour

- Never throws; unmatched installs return `{ attributed: false, reason: 'unmatched' }`.
- Persists a local “already matched” flag only after a **terminal** result (not on `network_error`).
- Same `cat_…` token as any web landing that only stamps the code with `@thspian/circuul-react`.

---

## Related

- [`@thspian/circuul-core`](https://www.npmjs.com/package/@thspian/circuul-core)
- [`@thspian/circuul-react`](https://www.npmjs.com/package/@thspian/circuul-react)

Create campaigns: [thspian.com](https://thspian.com)
