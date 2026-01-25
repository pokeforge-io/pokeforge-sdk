import type { components } from "../../generated/api";
import type { Page, PaginationOptions } from "../pagination/Page";
import { BaseResource } from "./BaseResource";

// Type aliases
type Series = components["schemas"]["Series"];
type SeriesType = components["schemas"]["SeriesType"];
type TcgType = components["schemas"]["TcgType"];

// Response types
type SeriesListResponse = components["schemas"]["SeriesListResponse"];
type SeriesSingleResponse = components["schemas"]["SeriesSingleResponse"];

/** Options for listing series */
export interface ListSeriesOptions extends PaginationOptions {
  /** Filter by TCG type (Pokemon, Magic, YuGiOh) */
  tcgType?: TcgType;
  /** Filter by series type (Standard, Special, Promo) */
  seriesType?: SeriesType;
}

/** Series API - browse card series */
export class SeriesResource extends BaseResource {
  /**
   * Get all series with optional filtering and pagination.
   *
   * @example
   * ```ts
   * // Get first page of series
   * const page = await client.series.list();
   *
   * // Filter by type
   * const standardSeries = await client.series.list({
   *   seriesType: 'Standard'
   * });
   *
   * // Iterate through all series
   * for await (const s of client.series.list()) {
   *   console.log(s.name);
   * }
   * ```
   */
  async list(options: ListSeriesOptions = {}): Promise<Page<Series>> {
    const query = this.buildQuery({
      page: options.page,
      pageSize: options.pageSize,
      tcgType: options.tcgType,
      seriesType: options.seriesType,
    });

    const response = await this.http.get<SeriesListResponse>("/Series", query);

    return this.createPagedResponse(response, (paginationOpts) =>
      this.list({ ...options, ...paginationOpts })
    );
  }

  /**
   * Get a single series by ID.
   *
   * @param id - The series GUID
   */
  async get(id: string): Promise<Series> {
    const response = await this.http.get<SeriesSingleResponse>(`/Series/${id}`);

    if (!response.data) {
      throw new Error("Series not found");
    }

    return response.data;
  }

  /**
   * Get a series by its URL-friendly slug.
   *
   * @param slug - The URL-friendly slug (e.g., "scarlet-violet")
   */
  async getBySlug(slug: string): Promise<Series> {
    const response = await this.http.get<SeriesSingleResponse>(
      `/Series/${slug}`
    );

    if (!response.data) {
      throw new Error("Series not found");
    }

    return response.data;
  }

  /**
   * Convenience method to iterate through all series.
   *
   * @example
   * ```ts
   * for await (const s of client.series.listAll()) {
   *   console.log(s.name);
   * }
   * ```
   */
  async *listAll(
    options: Omit<ListSeriesOptions, "page"> = {}
  ): AsyncGenerator<Series> {
    const page = await this.list({ ...options, page: 1 });
    yield* page;
  }
}
