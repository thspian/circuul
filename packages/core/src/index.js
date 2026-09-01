/**
 * @thspian/circuul-core — non-blocking Boxofix Circuul client.
 */

function normalizeBase(apiBase) {
  const base = String(apiBase || '').replace(/\/$/, '');
  if (!base) throw new Error('Circuul: apiBase is required');
  return base;
}

async function postJson(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body || {}),
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, json };
}

/**
 * Persist "already tried" only for terminal outcomes — not network/transient errors.
 */
function shouldPersistMatched(result) {
  if (!result || typeof result !== 'object') return false;
  if (result.attributed === true) return true;
  const terminal = new Set([
    'already_matched',
    'unmatched',
    'duplicate',
    'invalid_code',
    'missing_code',
    'no_code',
    'campaign_inactive',
    'program_inactive',
    'program_closed',
    'self_referral',
    'rate_limited',
    'not_credited',
    'insufficient_float',
    'web_campaigns_use_click_attribution',
    'missing_device',
    'invalid_app_token',
    'code_app_mismatch',
  ]);
  return terminal.has(result.reason);
}

/**
 * @param {{ apiBase: string, appToken: string }} config
 */
function createClient(config) {
  const apiBase = normalizeBase(config.apiBase);
  const appToken = String(config.appToken || '').trim();
  if (!appToken) throw new Error('Circuul: appToken is required');

  return {
    apiBase,
    appToken,

    async recordClick({ code, platform, user_agent, ip } = {}) {
      try {
        const { json } = await postJson(`${apiBase}/circuul/click`, {
          code,
          platform,
          user_agent,
          ip,
        });
        return json?.data || null;
      } catch {
        return null;
      }
    },

    /**
     * App-install attribution — call on first open from a mobile/RN app.
     * Always resolves. Never throws. Unmatched is a normal outcome.
     */
    async match(payload = {}) {
      try {
        const { json } = await postJson(`${apiBase}/circuul/match`, {
          app_token: appToken,
          ...payload,
        });
        const data = json?.data;
        if (data && typeof data.attributed === 'boolean') return data;
        return { attributed: false, reason: 'invalid_response' };
      } catch {
        return { attributed: false, reason: 'network_error' };
      }
    },

    /**
     * Web-visit attribution — call when the brand's landing page loads.
     * Always sends app_token. Always resolves. Never throws.
     */
    async visitConfirm(payload = {}) {
      try {
        const { json } = await postJson(`${apiBase}/circuul/visit-confirm`, {
          app_token: appToken,
          ...payload,
        });
        const data = json?.data;
        if (data && typeof data.attributed === 'boolean') return data;
        return { attributed: false, reason: 'invalid_response' };
      } catch {
        return { attributed: false, reason: 'network_error' };
      }
    },
  };
}

function extractCodeFromSearch(search) {
  if (!search) return null;
  const q = search.startsWith('?') ? search : `?${search}`;
  try {
    const params = new URLSearchParams(q);
    const raw =
      params.get('circuul_ref') ||
      params.get('ref') ||
      params.get('circuul') ||
      params.get('code') ||
      params.get('utm_content');
    if (!raw) return null;
    const code = String(raw).trim().split(/[?&#]/)[0].toUpperCase();
    return code.length >= 4 ? code : null;
  } catch {
    return null;
  }
}

module.exports = {
  createClient,
  extractCodeFromSearch,
  shouldPersistMatched,
};
