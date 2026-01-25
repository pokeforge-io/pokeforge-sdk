import type { components } from "../../generated/api";
import type { Page, PaginationOptions } from "../pagination/Page";
import { BaseResource } from "./BaseResource";

// Type aliases
type CollectionList = components["schemas"]["CollectionList"];
type CollectionDetail = components["schemas"]["CollectionDetail"];
type CollectionItem = components["schemas"]["CollectionItem"];
type CollectionType = components["schemas"]["CollectionType"];
type CollectionVisibility = components["schemas"]["CollectionVisibility"];
type CardCondition = components["schemas"]["CardCondition"];
type BulkAddItemsResult = components["schemas"]["BulkAddItemsResult"];
type BulkDeleteItemsResult = components["schemas"]["BulkDeleteItemsResult"];

// Response types
type CollectionListResponse = components["schemas"]["CollectionListResponse"];
type CollectionDetailResponse = components["schemas"]["CollectionDetailResponse"];
type CollectionCreateResponse = components["schemas"]["CollectionCreateResponse"];
type CollectionUpdateResponse = components["schemas"]["CollectionUpdateResponse"];
type CollectionDeleteResponse = components["schemas"]["CollectionDeleteResponse"];
type CollectionItemsListResponse = components["schemas"]["CollectionItemsListResponse"];
type CollectionItemResponse = components["schemas"]["CollectionItemResponse"];
type CollectionItemDeleteResponse = components["schemas"]["CollectionItemDeleteResponse"];
type BulkAddItemsResponse = components["schemas"]["BulkAddItemsResponse"];
type BulkDeleteItemsResponse = components["schemas"]["BulkDeleteItemsResponse"];

/** Options for creating a collection */
export interface CreateCollectionOptions {
  name: string;
  type?: CollectionType;
  visibility?: CollectionVisibility;
}

/** Options for updating a collection */
export interface UpdateCollectionOptions {
  name?: string;
  visibility?: CollectionVisibility;
}

/** Options for listing collection items */
export interface ListCollectionItemsOptions extends PaginationOptions {
  sortBy?: string;
  sortOrder?: string;
  search?: string;
}

/** Options for adding an item to a collection */
export interface AddCollectionItemOptions {
  cardId: string;
  quantity?: number;
  condition?: CardCondition;
  grade?: string;
  purchasePrice?: number;
  purchaseDate?: string;
  notes?: string;
}

/** Options for updating a collection item */
export interface UpdateCollectionItemOptions {
  quantity?: number;
  condition?: CardCondition;
  grade?: string;
  purchasePrice?: number;
  purchaseDate?: string;
  notes?: string;
}

/** Collections API - manage user card collections */
export class CollectionsResource extends BaseResource {
  /**
   * Get all collections for the authenticated user.
   *
   * @example
   * ```ts
   * const collections = await client.collections.list();
   * ```
   */
  async list(): Promise<CollectionList[]> {
    const response = await this.http.get<CollectionListResponse>("/Collections");
    return response.data ?? [];
  }

  /**
   * Get a single collection by ID.
   *
   * @param id - The collection GUID
   */
  async get(id: string): Promise<CollectionDetail> {
    const response = await this.http.get<CollectionDetailResponse>(
      `/Collections/${id}`
    );

    if (!response.data) {
      throw new Error("Collection not found");
    }

    return response.data;
  }

  /**
   * Create a new collection.
   *
   * @example
   * ```ts
   * const collection = await client.collections.create({
   *   name: 'My Rare Cards',
   *   type: 'Personal',
   *   visibility: 'Private'
   * });
   * ```
   */
  async create(options: CreateCollectionOptions): Promise<CollectionDetail> {
    const response = await this.http.post<CollectionCreateResponse>(
      "/Collections",
      {
        name: options.name,
        type: options.type,
        visibility: options.visibility,
      }
    );

    if (!response.data) {
      throw new Error("Failed to create collection");
    }

    return response.data;
  }

  /**
   * Update an existing collection.
   *
   * @param id - The collection GUID
   * @param options - Fields to update
   */
  async update(
    id: string,
    options: UpdateCollectionOptions
  ): Promise<CollectionDetail> {
    const response = await this.http.put<CollectionUpdateResponse>(
      `/Collections/${id}`,
      {
        name: options.name,
        visibility: options.visibility,
      }
    );

    if (!response.data) {
      throw new Error("Failed to update collection");
    }

    return response.data;
  }

  /**
   * Delete a collection.
   *
   * @param id - The collection GUID
   */
  async delete(id: string): Promise<void> {
    await this.http.delete<CollectionDeleteResponse>(`/Collections/${id}`);
  }

  /**
   * Get items in a collection with pagination.
   *
   * @param id - The collection GUID
   * @param options - Pagination and sorting options
   */
  async getItems(
    id: string,
    options: ListCollectionItemsOptions = {}
  ): Promise<Page<CollectionItem>> {
    const query = this.buildQuery({
      page: options.page,
      pageSize: options.pageSize,
      sortBy: options.sortBy,
      sortOrder: options.sortOrder,
      search: options.search,
    });

    const response = await this.http.get<CollectionItemsListResponse>(
      `/Collections/${id}/items`,
      query
    );

    return this.createPagedResponse(response, (paginationOpts) =>
      this.getItems(id, { ...options, ...paginationOpts })
    );
  }

  /**
   * Add an item to a collection.
   *
   * @param id - The collection GUID
   * @param options - Item details
   */
  async addItem(
    id: string,
    options: AddCollectionItemOptions
  ): Promise<CollectionItem> {
    const response = await this.http.post<CollectionItemResponse>(
      `/Collections/${id}/items`,
      {
        cardId: options.cardId,
        quantity: options.quantity,
        condition: options.condition,
        grade: options.grade,
        purchasePrice: options.purchasePrice,
        purchaseDate: options.purchaseDate,
        notes: options.notes,
      }
    );

    if (!response.data) {
      throw new Error("Failed to add item to collection");
    }

    return response.data;
  }

  /**
   * Update an item in a collection.
   *
   * @param collectionId - The collection GUID
   * @param itemId - The item GUID
   * @param options - Fields to update
   */
  async updateItem(
    collectionId: string,
    itemId: string,
    options: UpdateCollectionItemOptions
  ): Promise<CollectionItem> {
    const response = await this.http.put<CollectionItemResponse>(
      `/Collections/${collectionId}/items/${itemId}`,
      {
        quantity: options.quantity,
        condition: options.condition,
        grade: options.grade,
        purchasePrice: options.purchasePrice,
        purchaseDate: options.purchaseDate,
        notes: options.notes,
      }
    );

    if (!response.data) {
      throw new Error("Failed to update collection item");
    }

    return response.data;
  }

  /**
   * Remove an item from a collection.
   *
   * @param collectionId - The collection GUID
   * @param itemId - The item GUID
   */
  async removeItem(collectionId: string, itemId: string): Promise<void> {
    await this.http.delete<CollectionItemDeleteResponse>(
      `/Collections/${collectionId}/items/${itemId}`
    );
  }

  /**
   * Bulk add items to a collection.
   *
   * @param id - The collection GUID
   * @param items - Array of items to add
   */
  async bulkAddItems(
    id: string,
    items: AddCollectionItemOptions[]
  ): Promise<BulkAddItemsResult> {
    const response = await this.http.post<BulkAddItemsResponse>(
      `/Collections/${id}/items/bulk`,
      { items }
    );

    if (!response.data) {
      throw new Error("Failed to bulk add items");
    }

    return response.data;
  }

  /**
   * Bulk remove items from a collection.
   *
   * @param id - The collection GUID
   * @param itemIds - Array of item GUIDs to remove
   */
  async bulkRemoveItems(
    id: string,
    itemIds: string[]
  ): Promise<BulkDeleteItemsResult> {
    const response = await this.http.delete<BulkDeleteItemsResponse>(
      `/Collections/${id}/items/bulk`
    );

    // Note: The API uses DELETE with a body for bulk delete
    // We need to use the request method directly for this
    const result = await this.http.request<BulkDeleteItemsResponse>({
      method: "DELETE",
      path: `/Collections/${id}/items/bulk`,
      body: { itemIds },
    });

    if (!result.data) {
      throw new Error("Failed to bulk remove items");
    }

    return result.data;
  }
}
