import type { components } from "../../generated/api";

type ProblemDetails = components["schemas"]["ProblemDetails"];

/** Base error class for all PokeForge API errors */
export class PokeForgeError extends Error {
  readonly status: number;
  readonly type: string | undefined;
  readonly detail: string | undefined;
  readonly instance: string | undefined;
  readonly raw: ProblemDetails | undefined;

  constructor(
    message: string,
    status: number,
    problemDetails?: ProblemDetails
  ) {
    super(message);
    this.name = "PokeForgeError";
    this.status = status;
    this.type = problemDetails?.type ?? undefined;
    this.detail = problemDetails?.detail ?? undefined;
    this.instance = problemDetails?.instance ?? undefined;
    this.raw = problemDetails;
  }

  static fromResponse(status: number, body?: unknown): PokeForgeError {
    const pd = body as ProblemDetails | undefined;
    const message = pd?.title ?? pd?.detail ?? `HTTP ${status} error`;

    switch (status) {
      case 400:
        return new ValidationError(message, pd);
      case 401:
        return new AuthenticationError(message, pd);
      case 403:
        return new ForbiddenError(message, pd);
      case 404:
        return new NotFoundError(message, pd);
      case 429:
        return new RateLimitError(message, pd);
      default:
        return new PokeForgeError(message, status, pd);
    }
  }
}

/** Resource not found (404) */
export class NotFoundError extends PokeForgeError {
  constructor(message: string, pd?: ProblemDetails) {
    super(message, 404, pd);
    this.name = "NotFoundError";
  }
}

/** Authentication required or invalid (401) */
export class AuthenticationError extends PokeForgeError {
  constructor(message: string, pd?: ProblemDetails) {
    super(message, 401, pd);
    this.name = "AuthenticationError";
  }
}

/** Access denied (403) */
export class ForbiddenError extends PokeForgeError {
  constructor(message: string, pd?: ProblemDetails) {
    super(message, 403, pd);
    this.name = "ForbiddenError";
  }
}

/** Rate limit exceeded (429) */
export class RateLimitError extends PokeForgeError {
  readonly retryAfter: number | undefined;

  constructor(message: string, pd?: ProblemDetails, retryAfter?: number) {
    super(message, 429, pd);
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}

/** Request validation failed (400) */
export class ValidationError extends PokeForgeError {
  readonly errors: Record<string, string[]> | undefined;

  constructor(message: string, pd?: ProblemDetails) {
    super(message, 400, pd);
    this.name = "ValidationError";
    if (pd && "errors" in pd) {
      this.errors = pd["errors"] as Record<string, string[]>;
    }
  }
}

/** Request timed out */
export class TimeoutError extends PokeForgeError {
  constructor(message = "Request timed out") {
    super(message, 0);
    this.name = "TimeoutError";
  }
}

/** Network connectivity error */
export class NetworkError extends PokeForgeError {
  constructor(message = "Network error", cause?: Error) {
    super(message, 0);
    this.name = "NetworkError";
    this.cause = cause;
  }
}
