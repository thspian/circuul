const {
  createClient,
  shouldPersistMatched,
} = require('@thspian/circuul-core');

const INSTALL_KEY = 'circuul_install_id';
const MATCHED_KEY = 'circuul_matched';
const CODE_KEY = 'circuul_ref_code';

let AsyncStorage;
try {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch {
  AsyncStorage = null;
}

const memory = new Map();
const inFlight = new Map();

async function getItem(key) {
  if (AsyncStorage) return AsyncStorage.getItem(key);
  return memory.has(key) ? memory.get(key) : null;
}

async function setItem(key, value) {
  if (AsyncStorage) return AsyncStorage.setItem(key, value);
  memory.set(key, value);
}

async function ensureInstallId() {
  let id = await getItem(INSTALL_KEY);
  if (!id) {
    id = `rn_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    await setItem(INSTALL_KEY, id);
  }
  return id;
}

/**
 * Call once on cold start. Never throws. Does not block UI — fire-and-forget OK.
 *
 * Prefer wiring Play Install Referrer / Universal Links into `androidReferrer` / `code`.
 * Clipboard is last resort (iOS may prompt).
 */
async function init(options = {}) {
  const {
    appToken,
    apiBase,
    platform = 'unknown',
    androidReferrer,
    code,
    clipboardCode,
    idfv,
    gaid,
  } = options;

  try {
    if (code) await setItem(CODE_KEY, String(code).toUpperCase());
    const client = createClient({ appToken, apiBase });

    if ((await getItem(MATCHED_KEY)) === '1') {
      return { client, attributed: false, reason: 'already_matched' };
    }

    const flightKey = String(appToken);
    if (inFlight.has(flightKey)) {
      const result = await inFlight.get(flightKey);
      return { client, ...result };
    }

    const stored = await getItem(CODE_KEY);
    const promise = client
      .match({
        platform,
        install_id: await ensureInstallId(),
        android_referrer: androidReferrer,
        code: code || stored || undefined,
        clipboard_code: clipboardCode || undefined,
        idfv,
        gaid,
      })
      .then(async (result) => {
        if (shouldPersistMatched(result)) {
          await setItem(MATCHED_KEY, '1');
        }
        return result;
      })
      .finally(() => {
        inFlight.delete(flightKey);
      });

    inFlight.set(flightKey, promise);
    const result = await promise;
    return { client, ...result };
  } catch {
    return { attributed: false, reason: 'error' };
  }
}

const Circuul = { init, createClient };

module.exports = { Circuul, init, createClient };
