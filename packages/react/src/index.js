const {
  createClient,
  extractCodeFromSearch,
  shouldPersistMatched,
} = require('@thspian/circuul-core');

const STORAGE_KEY = 'circuul_ref_code';
const INSTALL_KEY = 'circuul_install_id';
const MATCHED_KEY = 'circuul_matched';

/** In-flight visit-confirm promises — dedupe React Strict Mode double-invoke. */
const inFlight = new Map();

function storageGet(key) {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function storageSet(key, value) {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

function ensureInstallId() {
  let id = storageGet(INSTALL_KEY);
  if (!id) {
    id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `web_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    storageSet(INSTALL_KEY, id);
  }
  return id;
}

/**
 * Initialise Circuul on a brand's web page. Safe to call on every page load; never throws.
 *
 * For `web_visit` campaigns:
 *   - Reads `circuul_ref` from the URL
 *   - Calls POST /circuul/visit-confirm (with app_token) to accrue CPA
 *
 * For `app_install` campaigns (smart banner / deep-link landing):
 *   - Only persists the referral code for the native app to pick up later
 *   - Does NOT call match() — install CPA is credited on first open in the app
 *
 * @param {{
 *   appToken: string,
 *   apiBase: string,
 *   kind?: 'web_visit' | 'app_install',
 *   search?: string,
 *   autoConfirm?: boolean,
 * }} options
 */
async function init(options = {}) {
  const {
    appToken,
    apiBase,
    kind = 'web_visit',
    search,
    autoConfirm = true,
  } = options;

  try {
    const client = createClient({ appToken, apiBase });
    const locationSearch =
      search || (typeof window !== 'undefined' ? window.location.search : '');

    if (kind === 'web_visit') {
      const params = new URLSearchParams(
        locationSearch.startsWith('?') ? locationSearch : `?${locationSearch}`
      );
      const code =
        params.get('circuul_ref') || extractCodeFromSearch(locationSearch);

      if (!code) return { client, attributed: false, reason: 'no_code' };

      storageSet(STORAGE_KEY, code);

      if (!autoConfirm) return { client, attributed: false, skipped: true };

      if (storageGet(MATCHED_KEY) === '1') {
        return { client, attributed: false, reason: 'already_matched' };
      }

      const flightKey = `${appToken}:${code}`;
      if (inFlight.has(flightKey)) {
        const result = await inFlight.get(flightKey);
        return { client, ...result };
      }

      const promise = client
        .visitConfirm({
          code,
          install_id: ensureInstallId(),
          user_agent:
            typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        })
        .then((result) => {
          if (shouldPersistMatched(result)) {
            storageSet(MATCHED_KEY, '1');
          }
          return result;
        })
        .finally(() => {
          inFlight.delete(flightKey);
        });

      inFlight.set(flightKey, promise);
      const result = await promise;
      return { client, ...result };
    }

    // app_install — web intermediate page: stamp code only; native SDK matches later.
    const fromUrl = extractCodeFromSearch(locationSearch);
    if (fromUrl) storageSet(STORAGE_KEY, fromUrl);

    return {
      client,
      attributed: false,
      reason: fromUrl ? 'code_stored' : 'no_code',
      code: fromUrl || null,
    };
  } catch {
    return { attributed: false, reason: 'error' };
  }
}

function getStoredCode() {
  return storageGet(STORAGE_KEY);
}

module.exports = {
  init,
  getStoredCode,
  extractCodeFromSearch,
  createClient,
};
