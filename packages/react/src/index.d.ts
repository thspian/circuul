export interface AttributionResult {
  attributed: boolean;
  reason?: string;
  code?: string;
  cpa_cents?: number;
  duplicate?: boolean;
  skipped?: boolean;
}

export interface CircuulClient {
  apiBase: string;
  appToken: string;
  match(payload: Record<string, unknown>): Promise<AttributionResult>;
  visitConfirm(payload: Record<string, unknown>): Promise<AttributionResult>;
}

export interface InitOptions {
  appToken: string;
  apiBase: string;
  kind?: 'web_visit' | 'app_install';
  search?: string;
  autoConfirm?: boolean;
}

export function init(
  options: InitOptions
): Promise<AttributionResult & { client?: CircuulClient }>;
export function getStoredCode(): string | null;
export function extractCodeFromSearch(search: string): string | null;
export function createClient(options: {
  appToken: string;
  apiBase: string;
}): CircuulClient;
