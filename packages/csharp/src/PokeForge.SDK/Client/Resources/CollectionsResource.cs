namespace PokeForge.SDK.Client.Resources;

using System.Runtime.CompilerServices;
using PokeForge.SDK.Client.Http;
using PokeForge.SDK.Client.Pagination;
using PokeForge.SDK.Exceptions;
using PokeForge.SDK.Generated;

/// <summary>
/// Options for listing collection items.
/// </summary>
public sealed class ListCollectionItemsOptions : PaginationOptions
{
    /// <summary>
    /// Sort field.
    /// </summary>
    public string? SortBy { get; set; }

    /// <summary>
    /// Sort order (asc or desc).
    /// </summary>
    public string? SortOrder { get; set; }

    internal ListCollectionItemsOptions Clone() => new()
    {
        Page = Page,
        PageSize = PageSize,
        SortBy = SortBy,
        SortOrder = SortOrder
    };
}

/// <summary>
/// Collections API - manage user card collections.
/// Requires authentication.
/// </summary>
public sealed class CollectionsResource : BaseResource
{
    internal CollectionsResource(HttpClientWrapper http) : base(http)
    {
    }

    /// <summary>
    /// Get all collections for the authenticated user.
    /// Creates default collections (My Collection, Wishlist) on first access.
    /// </summary>
    public async Task<IReadOnlyList<CollectionList>> ListAsync(CancellationToken cancellationToken = default)
    {
        var response = await Http.GetAsync<CollectionListResponse>("/Collections", cancellationToken: cancellationToken)
            .ConfigureAwait(false);

        return response?.Data ?? Array.Empty<CollectionList>();
    }

    /// <summary>
    /// Get a single collection by ID.
    /// Returns collection if owned by user or if collection is public.
    /// </summary>
    public async Task<CollectionDetail> GetAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var response = await Http.GetAsync<CollectionDetailResponse>($"/Collections/{id}", cancellationToken: cancellationToken)
            .ConfigureAwait(false);

        return response?.Data ?? throw new NotFoundException("Collection not found");
    }

    /// <summary>
    /// Create a new collection for the authenticated user.
    /// </summary>
    public async Task<CollectionDetail> CreateAsync(
        CreateCollectionRequest request,
        CancellationToken cancellationToken = default)
    {
        var response = await Http.PostAsync<CollectionCreateResponse>("/Collections", request, cancellationToken)
            .ConfigureAwait(false);

        return response?.Data ?? throw new PokeForgeException("Failed to create collection", 500);
    }

    /// <summary>
    /// Update an existing collection.
    /// Only the collection owner can update.
    /// </summary>
    public async Task<CollectionDetail> UpdateAsync(
        Guid id,
        UpdateCollectionRequest request,
        CancellationToken cancellationToken = default)
    {
        var response = await Http.PutAsync<CollectionUpdateResponse>($"/Collections/{id}", request, cancellationToken)
            .ConfigureAwait(false);

        return response?.Data ?? throw new PokeForgeException("Failed to update collection", 500);
    }

    /// <summary>
    /// Delete a collection (soft delete).
    /// Only the collection owner can delete. System collections and the default Wishlist cannot be deleted.
    /// </summary>
    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        await Http.DeleteAsync($"/Collections/{id}", cancellationToken)
            .ConfigureAwait(false);
    }

    /// <summary>
    /// Get paginated items in a collection.
    /// </summary>
    public async Task<Page<CollectionItemSummary>> ListItemsAsync(
        Guid collectionId,
        ListCollectionItemsOptions? options = null,
        CancellationToken cancellationToken = default)
    {
        options ??= new ListCollectionItemsOptions();

        var query = BuildQuery(
            ("page", options.Page),
            ("pageSize", options.PageSize),
            ("sortBy", options.SortBy),
            ("sortOrder", options.SortOrder)
        );

        var response = await Http.GetAsync<CollectionItemsListResponse>($"/Collections/{collectionId}/items", query, cancellationToken)
            .ConfigureAwait(false);

        return CreatePagedResponse(
            response!,
            r => r.Data,
            r => r.Pagination,
            async (page, pageSize, ct) =>
            {
                var newOptions = options.Clone();
                newOptions.Page = page;
                newOptions.PageSize = pageSize;
                return await ListItemsAsync(collectionId, newOptions, ct).ConfigureAwait(false);
            });
    }

    /// <summary>
    /// Add a card to a collection.
    /// </summary>
    public async Task<CollectionItemSummary> AddItemAsync(
        Guid collectionId,
        AddCollectionItemRequest request,
        CancellationToken cancellationToken = default)
    {
        var response = await Http.PostAsync<CollectionItemResponse>($"/Collections/{collectionId}/items", request, cancellationToken)
            .ConfigureAwait(false);

        return response?.Data ?? throw new PokeForgeException("Failed to add item to collection", 500);
    }

    /// <summary>
    /// Update a collection item.
    /// </summary>
    public async Task<CollectionItemSummary> UpdateItemAsync(
        Guid collectionId,
        Guid itemId,
        UpdateCollectionItemRequest request,
        CancellationToken cancellationToken = default)
    {
        var response = await Http.PutAsync<CollectionItemResponse>($"/Collections/{collectionId}/items/{itemId}", request, cancellationToken)
            .ConfigureAwait(false);

        return response?.Data ?? throw new PokeForgeException("Failed to update collection item", 500);
    }

    /// <summary>
    /// Remove an item from a collection.
    /// </summary>
    public async Task RemoveItemAsync(
        Guid collectionId,
        Guid itemId,
        CancellationToken cancellationToken = default)
    {
        await Http.DeleteAsync($"/Collections/{collectionId}/items/{itemId}", cancellationToken)
            .ConfigureAwait(false);
    }

    /// <summary>
    /// Iterate through all items in a collection using IAsyncEnumerable.
    /// </summary>
    public async IAsyncEnumerable<CollectionItemSummary> ListAllItemsAsync(
        Guid collectionId,
        ListCollectionItemsOptions? options = null,
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        options ??= new ListCollectionItemsOptions();
        options.Page = 1;

        var page = await ListItemsAsync(collectionId, options, cancellationToken).ConfigureAwait(false);

        await foreach (var item in page.WithCancellation(cancellationToken))
        {
            yield return item;
        }
    }
}
