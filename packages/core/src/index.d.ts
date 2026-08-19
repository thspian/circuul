export function createClient(config: {
  apiBase: string;
  appToken: string;
}): {
  apiBase: string;
  appToken: string;
  recordClick(payload?: {
    code?: string;
    platform?: string;
    user_agent?: string;
    ip?: string;
  }): Promise<any>;
  match(payload?: Record<string, any>): Promise<{
    attributed: boolean;
    reason?: string;
    code?: string;
    cpa_cents?: number;
    duplicate?: boolean;
  }>;
};

export function extractCodeFromSearch(search?: string): string | null;
