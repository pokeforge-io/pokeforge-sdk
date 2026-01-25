import type { components } from "../../generated/api";
import type { Page, PaginationOptions } from "../pagination/Page";
import { BaseResource } from "./BaseResource";

// Type aliases
type SetList = components["schemas"]["SetList"];
type SetDetail = components["schemas"]["SetDetail"];
type MasterChecklist = components["schemas"]["MasterChecklist"];
type SetType = components["schemas"]["SetType"];
type CardLocale = components["schemas"]["CardLocale"];

// Response types
type SetListResponse = components["schemas"]["SetListResponse"];
type SetSingleResponse = components["schemas"]["SetSingleResponse"];
type MasterChecklistResponse = components["schemas"]["MasterChecklistResponse"];

/** Options for listing sets */
export interface ListSetsOptions extends PaginationOptions {
  /** Filter by series ID */
  seriesId?: string;
  /** Filter by set type (Base, Expansion, SpecialEdition) */
  setType?: SetType;
  /** Filter by locale (US, UK, Japan, etc.) */
  locale?: CardLocale;
}

/** Options for getting a set by slug */
export interface GetSetBySlugOptions {
  /** Optional series ID to disambiguate slugs */
  seriesId?: string;
  /** Optional locale to disambiguate slugs (default: US) */
  locale?: CardLocale;
}

/** Sets API - browse card sets */
export class SetsResource extends BaseResource {
  /**
   * Get all sets with optional filtering and pagination.
   *
   * @example
   * ```ts
   * // Get first page of sets
   * const page = await client.sets.list();
   *
   * // Filter by series
   * const seriesSets = await client.sets.list({ seriesId: 'series-uuid' });
   *
   * // Iterate through all sets
   * for await (const set of client.sets.list()) {
   *   console.log(set.name);
   * }
   * ```
   */
  async list(options: ListSetsOptions = {}): Promise<Page<SetList>> {
    const query = this.buildQuery({
      page: options.page,
      pageSize: options.pageSize,
      seriesId: options.seriesId,
      setType: options.setType,
      locale: options.locale,
    });

    const response = await this.http.get<SetListResponse>("/Sets", query);

    return this.createPagedResponse(response, (paginationOpts) =>
      this.list({ ...options, ...paginationOpts })
    );
  }

  /**
   * Get a single set by ID.
   *
   * @param id - The set GUID
   */
  async get(id: string): Promise<SetDetail> {
    const response = await this.http.get<SetSingleResponse>(`/Sets/${id}`);

    if (!response.data) {
      throw new Error("Set not found");
    }

    return response.data;
  }

  /**
   * Get a set by its URL-friendly slug.
   *
   * @param slug - The URL-friendly slug (e.g., "151")
   * @param options - Optional series ID or locale to disambiguate
   */
  async getBySlug(
    slug: string,
    options: GetSetBySlugOptions = {}
  ): Promise<SetDetail> {
    const query = this.buildQuery({
      seriesId: options.seriesId,
      locale: options.locale,
    });

    const response = await this.http.get<SetSingleResponse>(
      `/Sets/${slug}`,
      query
    );

    if (!response.data) {
      throw new Error("Set not found");
    }

    return response.data;
  }

  /**
   * Get the master checklist for a set (all cards and variants).
   *
   * @param id - The set GUID
   */
  async getMasterChecklist(id: string): Promise<MasterChecklist> {
    const response = await this.http.get<MasterChecklistResponse>(
      `/Sets/${id}/checklist`
    );

    if (!response.data) {
      throw new Error("Checklist not found");
    }

    return response.data;
  }

  /**
   * Convenience method to iterate through all sets.
   *
   * @example
   * ```ts
   * for await (const set of client.sets.listAll()) {
   *   console.log(set.name);
   * }
   * ```
   */
  async *listAll(
    options: Omit<ListSetsOptions, "page"> = {}
  ): AsyncGenerator<SetList> {
    const page = await this.list({ ...options, page: 1 });
    yield* page;
  }
}
