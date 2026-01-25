import type { AuthConfig } from "./types";

/** Manages authentication tokens for API requests */
export class TokenManager {
  private staticToken: string | undefined;
  private getTokenFn: (() => Promise<string> | string) | undefined;

  constructor(auth?: AuthConfig) {
    if (auth?.type === "static") {
      this.staticToken = auth.token;
    } else if (auth?.type === "dynamic") {
      this.getTokenFn = auth.getToken;
    }
  }

  /** Get the current token (async to support dynamic tokens) */
  async getToken(): Promise<string | undefined> {
    if (this.staticToken) {
      return this.staticToken;
    }
    if (this.getTokenFn) {
      return await this.getTokenFn();
    }
    return undefined;
  }

  /** Update static token (for token refresh scenarios) */
  setToken(token: string): void {
    this.staticToken = token;
    this.getTokenFn = undefined;
  }

  /** Check if authentication is configured */
  hasAuth(): boolean {
    return !!(this.staticToken || this.getTokenFn);
  }
}
