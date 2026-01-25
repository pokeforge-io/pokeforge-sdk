import type { HttpClient } from "../http/HttpClient";
import type { Page, PaginationOptions, PageFetcher } from "../pagination/Page";
import { createPage } from "../pagination/Page";

/** Abstract base class for all resource classes */
export abstract class BaseResource {
  protected readonly http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  /** Helper to create paginated responses */
  protected createPagedResponse<
    TItem,
    TResponse extends { data?: TItem[] | null; pagination?: unknown }
  >(response: TResponse, fetcher: PageFetcher<TItem>): Page<TItem> {
    return createPage(response.data ?? [], response.pagination as Parameters<typeof createPage>[1], fetcher);
  }

  /** Build query params, filtering out undefined values */
  protected buildQuery<T extends Record<string, unknown>>(
    params: T
  ): { [K in keyof T]: Exclude<T[K], undefined> } {
    return Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined)
    ) as { [K in keyof T]: Exclude<T[K], undefined> };
  }
}
