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
 * Persist ?ref= from the URL and optionally match on first visit.
 * Safe to call on every page load; never throws.
 */
async function init(options = {}) {
  const { appToken, apiBase, search, autoMatch = true } = options;
  try {
    const fromUrl = extractCodeFromSearch(
      search ||
        (typeof window !== 'undefined' ? window.location.search : '')
    );
    if (fromUrl) storageSet(STORAGE_KEY, fromUrl);

    const client = createClient({ appToken, apiBase });
    if (!autoMatch) return { client, attributed: false, skipped: true };

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
