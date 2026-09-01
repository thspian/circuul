# Circuul SDK

Attribution SDK for Thspian UGC CPA campaigns. Supports **app install** and **web visit** attribution across all major platforms.

Brands create campaigns, creators share unique referral links, and Circuul tracks clicks → installs/visits → CPA payouts automatically.

---

## How it works

### App Install campaigns
1. User clicks creator's referral link → redirected to App Store / Play Store
2. User installs and opens the app for the first time
3. App calls `match()` on cold start → server matches the click → creator earns CPA

### Web Visit campaigns
1. User clicks creator's referral link → redirected to brand's website with `?circuul_ref=CODE`
2. Brand's website loads → SDK reads the code → calls `visitConfirm()` → creator earns CPA

---

## Packages

| Package | Platform | Install |
|---------|----------|---------|
| `@circuul/core` | Shared JS HTTP client | `npm install @circuul/core` |
| `@circuul/react` | React, Next.js, Vite, CRA | `npm install @circuul/react` |
| `@circuul/react-native` | React Native, Expo | `npm install @circuul/react-native` |
| `circuul` (Flutter) | Flutter (iOS + Android) | `flutter pub add circuul` |
| `native/ios/Circuul.swift` | Native iOS (Swift) | Drop file into Xcode |
| `native/android/Circuul.kt` | Native Android (Kotlin) | Drop file into project |

> You will receive an `appToken` (starts with `cat_…`) from Thspian when your campaign is approved.

---

## React / Next.js / Vite (Web)

### Installation
```bash
npm install @circuul/react
```

### Web Visit campaign
Call `init()` once on page load — typically in your root component or `_app.js`.

```js
import { init } from '@circuul/react';

// Next.js _app.js
import { useEffect } from 'react';

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    init({
      appToken: 'cat_…',
      apiBase: 'https://api.example.com/api/v1',
      kind: 'web_visit',
    }).then((result) => {
      console.log('[Circuul]', result);
      // { attributed: true, code: 'ABCD1234', cpa_cents: 75 }
    });
  }, []);

  return <Component {...pageProps} />;
}
```

### App Install campaign (web intermediate page)
If you have a smart banner or deep-link landing page that redirects to the app store:

```js
init({
  appToken: 'cat_…',
  apiBase: 'https://api.example.com/api/v1',
  kind: 'app_install',
});
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `appToken` | `string` | required | Your campaign app token |
| `apiBase` | `string` | required | Thspian API base URL |
| `kind` | `'web_visit' \| 'app_install'` | `'web_visit'` | Campaign type |
| `autoConfirm` | `boolean` | `true` | Set false to skip the API call |
| `search` | `string` | `window.location.search` | Override URL search string |

---

## React Native

Works with bare React Native and **Expo**.

### Installation
```bash
npm install @circuul/react-native
# Expo:
npx expo install @react-native-async-storage/async-storage
# Bare React Native:
npm install @react-native-async-storage/async-storage
cd ios && pod install
```

### Usage
Call `init()` once on cold start — in your root component or app entry point.

```js
import { Circuul } from '@circuul/react-native';
import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info'; // optional but recommended

// In your app root, e.g. App.js
useEffect(() => {
  (async () => {
    const result = await Circuul.init({
      appToken: 'cat_…',
      apiBase: 'https://api.example.com/api/v1',
      platform: Platform.OS,          // 'ios' or 'android'
      idfv: await DeviceInfo.getUniqueId(), // iOS: IDFV / Android: Android ID
      code: referralCodeFromDeepLink, // pass if you have it from a Universal Link / App Link
    });
    console.log('[Circuul]', result);
  })();
}, []);
```

### Getting the referral code from a deep link

**Universal Links / App Links** — extract the code from the URL:
```js
// In your deep link handler
const url = new URL(deepLinkUrl);
const code = url.searchParams.get('ref') || url.searchParams.get('circuul_ref');
```

**Play Install Referrer** (Android) — pass the raw referrer string directly:
```js
import { InstallReferrer } from 'react-native-install-referrer';

const referrer = await InstallReferrer.getReferrerString();
Circuul.init({
  ...
  androidReferrer: referrer, // SDK parses utm_content automatically
});
```

### Options

| Option | Type | Description |
|--------|------|-------------|
| `appToken` | `string` | Required. Your campaign app token |
| `apiBase` | `string` | Required. Thspian API base URL |
| `platform` | `string` | `'ios'` or `'android'` |
| `code` | `string` | Referral code from deep link / Universal Link |
| `androidReferrer` | `string` | Raw Play Install Referrer string |
| `clipboardCode` | `string` | Code read from clipboard (last resort) |
| `idfv` | `string` | iOS Identifier for Vendor (from `DeviceInfo.getUniqueId()`) |
| `gaid` | `string` | Google Advertising ID |

---

## Flutter

### Installation
Add to `pubspec.yaml`:
```yaml
dependencies:
  circuul:
    path: ./packages/flutter  # local — replace with pub.dev path after publishing
  http: ^1.0.0
  shared_preferences: ^2.0.0
```

Then run:
```bash
flutter pub get
```

### Usage
Call `match()` once on cold start — in `main.dart` or your app's `initState`.

```dart
import 'package:circuul/circuul.dart';

// In main() or initState()
void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  Circuul.instance.configure(
    appToken: 'cat_…',
    apiBase: 'https://api.example.com/api/v1',
  );

  runApp(const MyApp());
}

// In your root widget initState:
@override
void initState() {
  super.initState();
  _initCircuul();
}

Future<void> _initCircuul() async {
  final result = await Circuul.instance.match(
    platform: Platform.isIOS ? 'ios' : 'android',
    code: referralCodeFromDeepLink, // optional
  );
  debugPrint('[Circuul] attributed=${result.attributed} code=${result.code}');
}
```

### Getting the referral code from a deep link (Flutter)
```dart
// Using uni_links package
import 'package:uni_links/uni_links.dart';

final uri = await getInitialUri();
final code = uri?.queryParameters['ref'] ?? uri?.queryParameters['circuul_ref'];
```

### AttributionResult fields

| Field | Type | Description |
|-------|------|-------------|
| `attributed` | `bool` | Whether CPA was earned |
| `code` | `String?` | The referral code matched |
| `cpaCents` | `int?` | CPA amount in cents |
| `duplicate` | `bool` | True if already matched before |
| `reason` | `String?` | Reason if not attributed |

### Options

| Option | Type | Description |
|--------|------|-------------|
| `platform` | `string` | `'ios'` or `'android'` or `'flutter'` |
| `code` | `string?` | Referral code from deep link |
| `androidReferrer` | `string?` | Play Install Referrer string |
| `clipboardCode` | `string?` | Code from clipboard |
| `idfv` | `string?` | iOS Identifier for Vendor |
| `androidId` | `string?` | Android ID |
| `gaid` | `string?` | Google Advertising ID |

---

## Native iOS (Swift)

### Installation
Copy `native/ios/Circuul.swift` into your Xcode project. No dependencies required.

### Usage
```swift
// AppDelegate.swift or SceneDelegate.swift
import UIKit

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {

    Circuul.shared.configure(
      appToken: "cat_…",
      apiBase: "https://api.example.com/api/v1"
    )

    // Get IDFV for stronger dedup
    let idfv = UIDevice.current.identifierForVendor?.uuidString

    Circuul.shared.match(
      platform: "ios",
      code: referralCodeFromUniversalLink, // optional
      idfv: idfv
    ) { result in
      print("[Circuul]", result)
    }

    return true
  }
}
```

### Getting the referral code from a Universal Link
```swift
// In your SceneDelegate or AppDelegate
func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
  guard let url = userActivity.webpageURL else { return }
  let components = URLComponents(url: url, resolvingAgainstBaseURL: false)
  let code = components?.queryItems?.first(where: { $0.name == "ref" })?.value
  // Store and pass to Circuul.shared.match(code: code)
}
```

---

## Native Android (Kotlin)

### Installation
Copy `native/android/Circuul.kt` into your Android project under your app package.

Add to `build.gradle` (app level) — no extra dependencies needed beyond the Android SDK.

### Usage
```kotlin
// MainActivity.kt or Application.kt
class MyApplication : Application() {
  override fun onCreate() {
    super.onCreate()

    Circuul.configure(
      appToken = "cat_…",
      apiBase = "https://api.example.com/api/v1"
    )

    // Get Play Install Referrer (recommended)
    // See: https://developer.android.com/google/play/installreferrer
    val referrer = getInstallReferrerFromPlayStore() // your implementation

    Circuul.match(
      context = this,
      platform = "android",
      androidReferrer = referrer,
    ) { result ->
      Log.d("Circuul", result.toString())
    }
  }
}
```

### Getting the Play Install Referrer
```kotlin
// build.gradle
implementation 'com.android.installreferrer:installreferrer:2.2'

// Usage
val referrerClient = InstallReferrerClient.newBuilder(context).build()
referrerClient.startConnection(object : InstallReferrerStateListener {
  override fun onInstallReferrerSetupFinished(responseCode: Int) {
    if (responseCode == InstallReferrerClient.InstallReferrerResponse.OK) {
      val referrer = referrerClient.installReferrer.installReferrer
      Circuul.match(context = context, androidReferrer = referrer) { result ->
        Log.d("Circuul", result.toString())
      }
    }
  }
  override fun onInstallReferrerServiceDisconnected() {}
})
```

---

## Attribution result reasons

| Reason | Meaning |
|--------|---------|
| `already_matched` | Device already attributed — blocked client-side |
| `no_code` | No referral code found in URL or storage |
| `invalid_code` | Code doesn't match any active creator |
| `rate_limited` | Same IP already attributed within 24h (web visits) |
| `duplicate` | Already attributed for this device (app installs) |
| `program_inactive` | Campaign or program is no longer active |
| `network_error` | Could not reach the API |
| `error` | Unexpected error — attribution did not occur |

---

## Testing locally

Point `apiBase` at your local server:
```
apiBase: 'http://localhost:3000/api/v1'
```

**Web visit test:**
1. Get a creator's referral link: `http://localhost:3000/api/v1/circuul/r/CREATOR_CODE`
2. Visit it in the browser — it redirects to your site with `?circuul_ref=CODE`
3. `init()` fires → check the browser console for `[Circuul] { attributed: true, ... }`

**App install test (curl):**
```bash
# Step 1 — record the click
curl http://localhost:3000/api/v1/circuul/r/CREATOR_CODE

# Step 2 — simulate app first-open
curl -X POST http://localhost:3000/api/v1/circuul/match \
  -H "Content-Type: application/json" \
  -d '{
    "app_token": "cat_…",
    "platform": "ios",
    "install_id": "test-device-uuid-001",
    "code": "CREATOR_CODE"
  }'
```
