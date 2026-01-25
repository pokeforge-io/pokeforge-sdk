// Main client
export { PokeForgeClient } from "./PokeForgeClient";

// HTTP utilities
export type {
  PokeForgeClientConfig,
  AuthConfig,
  RetryDelayConfig,
} from "./http";

// Errors
export {
  PokeForgeError,
  NotFoundError,
  AuthenticationError,
  ForbiddenError,
  RateLimitError,
  ValidationError,
  TimeoutError,
  NetworkError,
} from "./errors";

// Pagination
export type { Page, PageInfo, PaginationOptions } from "./pagination";

// Resources and their option types
export type {
  ListCardsOptions,
  SearchCardsOptions,
  ListSetsOptions,
  GetSetBySlugOptions,
  ListSeriesOptions,
  CreateCollectionOptions,
  UpdateCollectionOptions,
  ListCollectionItemsOptions,
  AddCollectionItemOptions,
  UpdateCollectionItemOptions,
  AddFavoriteResult,
} from "./resources";
