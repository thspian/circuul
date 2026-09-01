export interface AttributionResult {
  attributed: boolean;
  reason?: string;
  code?: string;
  cpa_cents?: number;
  duplicate?: boolean;
}

export interface CircuulInitOptions {
  appToken: string;
  apiBase: string;
  platform?: string;
  code?: string;
  androidReferrer?: string;
  clipboardCode?: string;
  idfv?: string;
  gaid?: string;
}

export interface CircuulClient {
  match(payload: Record<string, unknown>): Promise<AttributionResult>;
}

export function init(options: CircuulInitOptions): Promise<AttributionResult & { client: CircuulClient }>;
export function createClient(options: { appToken: string; apiBase: string }): CircuulClient;

export declare const Circuul: {
  init: typeof init;
  createClient: typeof createClient;
};
