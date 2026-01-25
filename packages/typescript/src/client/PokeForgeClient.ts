import { HttpClient } from "./http/HttpClient";
import type { PokeForgeClientConfig } from "./http/types";
import { CardsResource } from "./resources/CardsResource";
import { SetsResource } from "./resources/SetsResource";
import { SeriesResource } from "./resources/SeriesResource";
import { CollectionsResource } from "./resources/CollectionsResource";
import { FavoritesResource } from "./resources/FavoritesResource";

/**
 * The main PokeForge API client.
 *
 * @example
 * ```ts
 * import { PokeForgeClient } from '@pokeforge/sdk';
 *
 * const client = new PokeForgeClient({
 *   baseUrl: 'https://api.pokeforge.gg',
 *   auth: { type: 'static', token: 'your-jwt-token' }
 * });
 *
 * // List cards
 * const cards = await client.cards.list({ rarity: 'Rare' });
 *
 * // Get a single card
 * const card = await client.cards.get('card-uuid');
 *
 * // Iterate through all cards
 * for await (const card of client.cards.list()) {
 *   console.log(card.name);
 * }
 * ```
 */
export class PokeForgeClient {
  private readonly http: HttpClient;

  /** Cards API - browse and search Pokemon cards */
  readonly cards: CardsResource;

  /** Sets API - browse card sets */
  readonly sets: SetsResource;

  /** Series API - browse card series */
  readonly series: SeriesResource;

  /** Collections API - manage user card collections */
  readonly collections: CollectionsResource;

  /** Favorites API - manage favorite cards */
  readonly favorites: FavoritesResource;

  /**
   * Create a new PokeForge client.
   *
   * @param config - Client configuration
   */
  constructor(config: PokeForgeClientConfig) {
    this.http = new HttpClient(config);

    // Initialize all resource classes
    this.cards = new CardsResource(this.http);
    this.sets = new SetsResource(this.http);
    this.series = new SeriesResource(this.http);
    this.collections = new CollectionsResource(this.http);
    this.favorites = new FavoritesResource(this.http);
  }

  /**
   * Create a new client instance with updated configuration.
   * Useful for changing authentication mid-session.
   *
   * @param config - Partial configuration to merge
   * @returns A new client instance
   */
  withConfig(config: Partial<PokeForgeClientConfig>): PokeForgeClient {
    const currentConfig = this.http.getConfig();
    return new PokeForgeClient({ ...currentConfig, ...config });
  }

  /**
   * Health check endpoint.
   * Throws if the API is not reachable.
   */
  async health(): Promise<void> {
    await this.http.get("/health");
  }
}
