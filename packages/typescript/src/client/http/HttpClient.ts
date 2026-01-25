import {
  PokeForgeError,
  TimeoutError,
  NetworkError,
  RateLimitError,
} from "../errors";
import { TokenManager } from "./TokenManager";
import type { PokeForgeClientConfig, RequestConfig, RetryDelayConfig } from "./types";

/** HTTP client for making API requests */
export class HttpClient {
  private readonly baseUrl: string;
  private readonly tokenManager: TokenManager;
  private readonly fetchFn: typeof fetch;
  private readonly timeout: number;
  private readonly retries: number;
  private readonly retryDelay: Required<RetryDelayConfig>;
  private readonly config: PokeForgeClientConfig;

  constructor(config: PokeForgeClientConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.tokenManager = new TokenManager(config.auth);
    this.fetchFn = config.fetch ?? globalThis.fetch;
    this.timeout = config.timeout ?? 30000;
    this.retries = config.retries ?? 3;
    this.retryDelay = {
      base: config.retryDelay?.base ?? 1000,
      max: config.retryDelay?.max ?? 30000,
      exponential: config.retryDelay?.exponential ?? true,
    };
  }

  /** Get the current configuration (for creating new clients with modified config) */
  getConfig(): PokeForgeClientConfig {
    return { ...this.config };
  }

  /** Make an HTTP request */
  async request<T>(reqConfig: RequestConfig): Promise<T> {
    const url = this.buildUrl(reqConfig.path, reqConfig.query);
    const headers = await this.buildHeaders(reqConfig.headers);
    const timeout = reqConfig.timeout ?? this.timeout;

    const requestInit: RequestInit = {
      method: reqConfig.method,
      headers,
    };

    if (reqConfig.body !== undefined) {
      requestInit.body = JSON.stringify(reqConfig.body);
    }

    const maxAttempts = reqConfig.noRetry ? 1 : this.retries + 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await this.fetchWithTimeout(url, requestInit, timeout);

        if (response.ok) {
          // Handle empty responses (204 No Content, etc.)
          const contentType = response.headers.get("content-type");
          if (
            response.status === 204 ||
            !contentType?.includes("application/json")
          ) {
            return undefined as T;
          }
          return (await response.json()) as T;
        }

        // Handle errors
        const error = await this.handleErrorResponse(response);

        // Retry on 429 (rate limit) or 5xx (server errors)
        if (
          attempt < maxAttempts &&
          (response.status === 429 || response.status >= 500)
        ) {
          const delay = this.calculateDelay(attempt, error);
          await this.sleep(delay);
          continue;
        }

        throw error;
      } catch (err) {
        // Re-throw PokeForge errors
        if (err instanceof PokeForgeError) {
          throw err;
        }

        // Handle abort (timeout)
        if (err instanceof DOMException && err.name === "AbortError") {
          throw new TimeoutError(`Request timed out after ${timeout}ms`);
        }

        // Handle network errors
        if (err instanceof TypeError) {
          if (attempt < maxAttempts) {
            const delay = this.calculateDelay(attempt);
            await this.sleep(delay);
            continue;
          }
          throw new NetworkError("Network error", err);
        }

        throw err;
      }
    }

    // Should not reach here, but TypeScript needs this
    throw new NetworkError("Request failed after retries");
  }

  /** GET request */
  get<T>(
    path: string,
    query?: Record<string, string | number | boolean | string[] | undefined>
  ): Promise<T> {
    const config: RequestConfig = { method: "GET", path };
    if (query !== undefined) {
      config.query = query;
    }
    return this.request<T>(config);
  }

  /** POST request */
  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>({ method: "POST", path, body });
  }

  /** PUT request */
  put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>({ method: "PUT", path, body });
  }

  /** DELETE request */
  delete<T>(path: string): Promise<T> {
    return this.request<T>({ method: "DELETE", path });
  }

  private buildUrl(
    path: string,
    query?: Record<string, string | number | boolean | string[] | undefined>
  ): string {
    const url = new URL(path, this.baseUrl);

    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value === undefined) continue;

        if (Array.isArray(value)) {
          for (const v of value) {
            url.searchParams.append(key, v);
          }
        } else {
          url.searchParams.set(key, String(value));
        }
      }
    }

    return url.toString();
  }

  private async buildHeaders(
    custom?: Record<string, string>
  ): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...custom,
    };

    const token = await this.tokenManager.getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  }

  private async fetchWithTimeout(
    url: string,
    init: RequestInit,
    timeout: number
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      return await this.fetchFn(url, {
        ...init,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async handleErrorResponse(response: Response): Promise<PokeForgeError> {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      // Body might not be JSON
    }

    // Extract retry-after header for rate limit errors
    if (response.status === 429) {
      const retryAfter = response.headers.get("retry-after");
      const retryMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : undefined;
      return new RateLimitError(
        "Rate limit exceeded",
        body as ConstructorParameters<typeof RateLimitError>[1],
        retryMs
      );
    }

    return PokeForgeError.fromResponse(response.status, body);
  }

  private calculateDelay(attempt: number, error?: PokeForgeError): number {
    // Use retry-after if available
    if (error instanceof RateLimitError && error.retryAfter) {
      return Math.min(error.retryAfter, this.retryDelay.max);
    }

    // Exponential backoff
    if (this.retryDelay.exponential) {
      const delay = this.retryDelay.base * Math.pow(2, attempt - 1);
      return Math.min(delay, this.retryDelay.max);
    }

    return this.retryDelay.base;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
