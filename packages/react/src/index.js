const { createClient, extractCodeFromSearch } = require('@circuul/core');

const STORAGE_KEY = 'circuul_ref_code';
const INSTALL_KEY = 'circuul_install_id';
const MATCHED_KEY = 'circuul_matched';

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
 * For `web_visit` campaigns (ecommerce / landing pages):
 *   - Reads `circuul_ref` from the URL (appended by the server redirect)
 *   - Calls POST /circuul/visit-confirm to confirm the visit and accrue CPA
 *
 * For `app_install` campaigns (smart banner / deep-link landing pages):
 *   - Reads ref code from URL query params
 *   - Calls POST /circuul/match
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
      // circuul_ref is appended by our server to the redirect URL for web_visit campaigns.
      const params = new URLSearchParams(
        locationSearch.startsWith('?') ? locationSearch : `?${locationSearch}`
      );
      const code =
        params.get('circuul_ref') || extractCodeFromSearch(locationSearch);

      if (!code) return { client, attributed: false, reason: 'no_code' };

      // Persist so attribution still works if the user navigates within the site.
      storageSet(STORAGE_KEY, code);

      if (!autoConfirm) return { client, attributed: false, skipped: true };

      if (storageGet(MATCHED_KEY) === '1') {
        return { client, attributed: false, reason: 'already_matched' };
      }

      // Set flag synchronously before the async call to prevent React Strict Mode
      // double-invoke from sending two concurrent visit-confirm requests.
      storageSet(MATCHED_KEY, '1');

      const result = await client.visitConfirm({
        code,
        install_id: ensureInstallId(),
        user_agent:
          typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      });

      return { client, ...result };
    }

    // app_install — web intermediate page (e.g. smart banner / deep-link landing).
    const fromUrl = extractCodeFromSearch(locationSearch);
    if (fromUrl) storageSet(STORAGE_KEY, fromUrl);

    if (!autoConfirm) return { client, attributed: false, skipped: true };

    if (storageGet(MATCHED_KEY) === '1') {
      return { client, attributed: false, reason: 'already_matched' };
    }

    const code = storageGet(STORAGE_KEY);
    const result = await client.match({
      platform: 'web',
      install_id: ensureInstallId(),
      code: code || undefined,
      clipboard_code: code || undefined,
      user_agent:
        typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    });

    storageSet(MATCHED_KEY, '1');
    return { client, ...result };
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
