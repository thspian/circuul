export interface AttributionResult {
  attributed: boolean;
  reason?: string;
  code?: string;
  cpa_cents?: number;
  duplicate?: boolean;
}

export interface CircuulClient {
  apiBase: string;
  appToken: string;
  recordClick(payload?: {
    code?: string;
    platform?: string;
    user_agent?: string;
    ip?: string;
  }): Promise<any>;
  /** App-install attribution — call on first open from a mobile/RN app. */
  match(payload?: Record<string, any>): Promise<AttributionResult>;
  /** Web-visit attribution — call when the brand's landing page loads in a browser. */
  visitConfirm(payload?: {
    code: string;
    user_agent?: string;
    ip?: string;
  }): Promise<AttributionResult>;
}

export function createClient(config: {
  apiBase: string;
  appToken: string;
}): CircuulClient;

export function extractCodeFromSearch(search?: string): string | null;
