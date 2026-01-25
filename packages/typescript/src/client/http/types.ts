/** Configuration for the PokeForge client */
export interface PokeForgeClientConfig {
  /** Base URL for the API (e.g., "https://api.pokeforge.gg") */
  baseUrl: string;

  /** Authentication configuration */
  auth?: AuthConfig;

  /** Custom fetch implementation (defaults to global fetch) */
  fetch?: typeof fetch;

  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;

  /** Number of retry attempts for failed requests (default: 3) */
  retries?: number;

  /** Retry delay configuration */
  retryDelay?: RetryDelayConfig;
}

/** Authentication configuration */
export type AuthConfig =
  | { type: "static"; token: string }
  | { type: "dynamic"; getToken: () => Promise<string> | string };

/** Retry delay configuration */
export interface RetryDelayConfig {
  /** Base delay in ms (default: 1000) */
  base?: number;
  /** Maximum delay in ms (default: 30000) */
  max?: number;
  /** Use exponential backoff (default: true) */
  exponential?: boolean;
}

/** Internal request configuration */
export interface RequestConfig {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  query?: Record<string, string | number | boolean | string[] | undefined>;
  body?: unknown;
  headers?: Record<string, string>;
  /** Override default timeout for this request */
  timeout?: number;
  /** Skip retry logic for this request */
  noRetry?: boolean;
}
