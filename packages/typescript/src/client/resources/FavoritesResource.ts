import type { components } from "../../generated/api";
import type { Page, PaginationOptions } from "../pagination/Page";
import { BaseResource } from "./BaseResource";

// Type aliases
type FavoriteCard = components["schemas"]["FavoriteCard"];

// Response types
type FavoritesListResponse = components["schemas"]["FavoritesListResponse"];
type FavoriteAddResponse = components["schemas"]["FavoriteAddResponse"];
type FavoritesCheckResponse = components["schemas"]["FavoritesCheckResponse"];

/** Result of adding a favorite */
export interface AddFavoriteResult {
  card: FavoriteCard;
  wasAlreadyFavorited: boolean;
}

/** Favorites API - manage favorite cards */
export class FavoritesResource extends BaseResource {
  /**
   * Get all favorite cards for the authenticated user.
   *
   * @example
   * ```ts
   * const favorites = await client.favorites.list();
   *
   * // Iterate through all favorites
   * for await (const card of client.favorites.list()) {
   *   console.log(card.cardName);
   * }
   * ```
   */
  async list(options: PaginationOptions = {}): Promise<Page<FavoriteCard>> {
    const query = this.buildQuery({
      page: options.page,
      pageSize: options.pageSize,
    });

    const response = await this.http.get<FavoritesListResponse>(
      "/Favorites",
      query
    );

    return this.createPagedResponse(response, (paginationOpts) =>
      this.list({ ...options, ...paginationOpts })
    );
  }

  /**
   * Add a card to favorites.
   *
   * @param cardId - The card GUID
   * @returns Result indicating if card was added or already favorited
   */
  async add(cardId: string): Promise<AddFavoriteResult> {
    const response = await this.http.post<FavoriteAddResponse>(
      `/Favorites/${cardId}`
    );

    if (!response.data) {
      throw new Error("Failed to add favorite");
    }

    return {
      card: response.data,
      wasAlreadyFavorited: response.wasAlreadyFavorited ?? false,
    };
  }

  /**
   * Remove a card from favorites.
   *
   * @param cardId - The card GUID
   */
  async remove(cardId: string): Promise<void> {
    await this.http.delete(`/Favorites/${cardId}`);
  }

  /**
   * Check if cards are favorited.
   *
   * @param cardIds - Array of card GUIDs to check
   * @returns Map of card ID to favorite status
   *
   * @example
   * ```ts
   * const status = await client.favorites.check(['card-1', 'card-2']);
   * console.log(status['card-1']); // true or false
   * ```
   */
  async check(cardIds: string[]): Promise<Record<string, boolean>> {
    const query = this.buildQuery({
      cardIds: cardIds.join(","),
    });

    const response = await this.http.get<FavoritesCheckResponse>(
      "/Favorites/check",
      query
    );

    return response.data ?? {};
  }

  /**
   * Toggle a card's favorite status.
   * If favorited, removes it. If not favorited, adds it.
   *
   * @param cardId - The card GUID
   * @returns True if now favorited, false if removed
   */
  async toggle(cardId: string): Promise<boolean> {
    const status = await this.check([cardId]);
    const isFavorited = status[cardId] ?? false;

    if (isFavorited) {
      await this.remove(cardId);
      return false;
    } else {
      await this.add(cardId);
      return true;
    }
  }

  /**
   * Convenience method to iterate through all favorites.
   */
  async *listAll(
    options: Omit<PaginationOptions, "page"> = {}
  ): AsyncGenerator<FavoriteCard> {
    const page = await this.list({ ...options, page: 1 });
    yield* page;
  }
}
