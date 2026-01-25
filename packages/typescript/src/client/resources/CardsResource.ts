import type { components } from "../../generated/api";
import type { Page, PaginationOptions } from "../pagination/Page";
import { BaseResource } from "./BaseResource";

// Type aliases for cleaner code
type CardList = components["schemas"]["CardList"];
type CardDetail = components["schemas"]["CardDetail"];
type CardFilterOptions = components["schemas"]["CardFilterOptions"];
type CardVariant = components["schemas"]["CardVariant"];
type CardSortField = components["schemas"]["CardSortField"];
type SortOrder = components["schemas"]["SortOrder"];

// Response types
type CardListResponse = components["schemas"]["CardListResponse"];
type CardSingleResponse = components["schemas"]["CardSingleResponse"];
type CardSearchResponse = components["schemas"]["CardSearchResponse"];
type CardFiltersResponse = components["schemas"]["CardFiltersResponse"];
type CardVariantsResponse = components["schemas"]["CardVariantsResponse"];

/** Options for listing cards */
export interface ListCardsOptions extends PaginationOptions {
  /** Filter by set ID */
  setId?: string;
  /** Filter by series ID (via set) */
  seriesId?: string;
  /** Filter by rarity (comma-separated for OR, e.g., "Rare,Common") */
  rarity?: string;
  /** Filter by supertype (comma-separated for OR, e.g., "Pokemon,Trainer") */
  supertype?: string;
  /** Filter by subtype (comma-separated for OR, e.g., "Basic,GX") */
  subtype?: string;
  /** Filter by Pokemon type (comma-separated for OR, e.g., "Fire,Water") */
  pokemonType?: string;
  /** Filter by artist name (exact match) */
  artistName?: string;
  /** Sort field (Name, Number, Rarity, SetName). Default: SetName */
  sortBy?: CardSortField;
  /** Sort order (Asc, Desc). Default: Asc */
  sortOrder?: SortOrder;
  /** Search by card name or number (case-insensitive substring match) */
  search?: string;
}

/** Options for searching cards */
export interface SearchCardsOptions extends PaginationOptions {
  /** Search query (required) */
  q: string;
  /** Limit search to specific set */
  setId?: string;
}

/** Cards API - browse and search Pokemon cards */
export class CardsResource extends BaseResource {
  /**
   * Get all cards with optional filtering, sorting, and pagination.
   *
   * @example
   * ```ts
   * // Get first page of cards
   * const page = await client.cards.list();
   *
   * // Filter by set and rarity
   * const rarePage = await client.cards.list({
   *   setId: 'set-uuid',
   *   rarity: 'Rare,HoloRare'
   * });
   *
   * // Iterate through all pages
   * for await (const card of client.cards.list()) {
   *   console.log(card.name);
   * }
   * ```
   */
  async list(options: ListCardsOptions = {}): Promise<Page<CardList>> {
    const query = this.buildQuery({
      page: options.page,
      pageSize: options.pageSize,
      setId: options.setId,
      seriesId: options.seriesId,
      rarity: options.rarity,
      supertype: options.supertype,
      subtype: options.subtype,
      pokemonType: options.pokemonType,
      artistName: options.artistName,
      sortBy: options.sortBy,
      sortOrder: options.sortOrder,
      search: options.search,
    });

    const response = await this.http.get<CardListResponse>("/Cards", query);

    return this.createPagedResponse(response, (paginationOpts) =>
      this.list({ ...options, ...paginationOpts })
    );
  }

  /**
   * Get a single card by ID with full details.
   *
   * @param id - The card GUID
   */
  async get(id: string): Promise<CardDetail> {
    const response = await this.http.get<CardSingleResponse>(`/Cards/${id}`);

    if (!response.data) {
      throw new Error("Card not found");
    }

    return response.data;
  }

  /**
   * Search cards by name or number.
   *
   * @example
   * ```ts
   * const results = await client.cards.search({ q: 'Pikachu' });
   * ```
   */
  async search(options: SearchCardsOptions): Promise<Page<CardList>> {
    const query = this.buildQuery({
      q: options.q,
      page: options.page,
      pageSize: options.pageSize,
      setId: options.setId,
    });

    const response = await this.http.get<CardSearchResponse>(
      "/Cards/search",
      query
    );

    return this.createPagedResponse(response, (paginationOpts) =>
      this.search({ ...options, ...paginationOpts })
    );
  }

  /**
   * Get all variants of a card (Normal, Reverse Holo, etc.).
   *
   * @param id - The card GUID
   */
  async getVariants(id: string): Promise<CardVariant[]> {
    const response = await this.http.get<CardVariantsResponse>(
      `/Cards/${id}/variants`
    );

    return response.variants ?? [];
  }

  /**
   * Get available filter options based on existing card data.
   */
  async getFilters(): Promise<CardFilterOptions> {
    const response = await this.http.get<CardFiltersResponse>("/Cards/filters");

    if (!response.data) {
      throw new Error("Failed to fetch card filters");
    }

    return response.data;
  }

  /**
   * Record a view for a card (analytics, fire-and-forget).
   *
   * @param id - The card GUID
   */
  async recordView(id: string): Promise<void> {
    await this.http.post(`/Cards/${id}/views`);
  }

  /**
   * Convenience method to iterate through all cards matching criteria.
   * Uses async iteration internally.
   *
   * @example
   * ```ts
   * for await (const card of client.cards.listAll({ rarity: 'Rare' })) {
   *   console.log(card.name);
   * }
   * ```
   */
  async *listAll(
    options: Omit<ListCardsOptions, "page"> = {}
  ): AsyncGenerator<CardList> {
    const page = await this.list({ ...options, page: 1 });
    yield* page;
  }
}
