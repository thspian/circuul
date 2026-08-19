# Circuul

Install attribution SDK for Thspian UGC hybrid CPA campaigns.

Partner apps wrap with Circuul using a public **app token** (`cat_…`). Creators share unique links. Boxofix records the click and matches first open.

## Packages

| Package | Platform |
|---------|----------|
| `@circuul/core` | Shared HTTP client |
| `@circuul/react` | React / Next.js |
| `@circuul/react-native` | React Native |
| `native/ios` | Swift |
| `native/android` | Kotlin |

## Quick start (React Native)

```js
import { Circuul } from '@circuul/react-native';

await Circuul.init({
  appToken: 'cat_…',
  apiBase: 'https://your-api.example/api/v1',
});
// never blocks; unmatched is normal
```

See `boxofix/docs/CIRCUUL_APP_INSTALL_API_CONTRACT.md` for the full API.
