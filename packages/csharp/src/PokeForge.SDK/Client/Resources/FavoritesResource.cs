namespace PokeForge.SDK.Client.Resources;

using System.Runtime.CompilerServices;
using PokeForge.SDK.Client.Http;
using PokeForge.SDK.Client.Pagination;
using PokeForge.SDK.Generated;

/// <summary>
/// Options for listing favorites.
/// </summary>
public sealed class ListFavoritesOptions : PaginationOptions
{
    internal ListFavoritesOptions Clone() => new()
    {
        Page = Page,
        PageSize = PageSize
    };
}

/// <summary>
/// Favorites API - manage favorite cards.
/// Requires authentication.
/// </summary>
public sealed class FavoritesResource : BaseResource
{
    internal FavoritesResource(HttpClientWrapper http) : base(http)
    {
    }

    /// <summary>
    /// Get all favorited cards for the authenticated user.
    /// </summary>
    public async Task<Page<FavoriteCard>> ListAsync(
        ListFavoritesOptions? options = null,
        CancellationToken cancellationToken = default)
    {
        options ??= new ListFavoritesOptions();

        var query = BuildQuery(
            ("page", options.Page),
            ("pageSize", options.PageSize)
        );

        var response = await Http.GetAsync<FavoriteListResponse>("/Favorites", query, cancellationToken)
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
                return await ListAsync(newOptions, ct).ConfigureAwait(false);
            });
    }

    /// <summary>
    /// Add a card to favorites.
    /// </summary>
    public async Task AddAsync(Guid cardId, CancellationToken cancellationToken = default)
    {
        await Http.PostAsync<FavoriteAddResponse>($"/Favorites/{cardId}", cancellationToken: cancellationToken)
            .ConfigureAwait(false);
    }

    /// <summary>
    /// Remove a card from favorites.
    /// </summary>
    public async Task RemoveAsync(Guid cardId, CancellationToken cancellationToken = default)
    {
        await Http.DeleteAsync($"/Favorites/{cardId}", cancellationToken)
            .ConfigureAwait(false);
    }

    /// <summary>
    /// Iterate through all favorite cards using IAsyncEnumerable.
    /// </summary>
    public async IAsyncEnumerable<FavoriteCard> ListAllAsync(
        ListFavoritesOptions? options = null,
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        options ??= new ListFavoritesOptions();
        options.Page = 1;

        var page = await ListAsync(options, cancellationToken).ConfigureAwait(false);

        await foreach (var favorite in page.WithCancellation(cancellationToken))
        {
            yield return favorite;
        }
    }
}
