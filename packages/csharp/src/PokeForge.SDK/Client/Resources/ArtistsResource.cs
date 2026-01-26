namespace PokeForge.SDK.Client.Resources;

using System.Runtime.CompilerServices;
using PokeForge.SDK.Client.Http;
using PokeForge.SDK.Client.Pagination;
using PokeForge.SDK.Generated;

/// <summary>
/// Options for listing artists.
/// </summary>
public sealed class ListArtistsOptions : PaginationOptions
{
    /// <summary>
    /// Search by artist name.
    /// </summary>
    public string? Search { get; set; }

    internal ListArtistsOptions Clone() => new()
    {
        Page = Page,
        PageSize = PageSize,
        Search = Search
    };
}

/// <summary>
/// Artists API - browse card artists.
/// </summary>
public sealed class ArtistsResource : BaseResource
{
    internal ArtistsResource(HttpClientWrapper http) : base(http)
    {
    }

    /// <summary>
    /// Get all artists with preview cards and collection progress.
    /// </summary>
    public async Task<Page<ArtistList>> ListAsync(
        ListArtistsOptions? options = null,
        CancellationToken cancellationToken = default)
    {
        options ??= new ListArtistsOptions();

        var query = BuildQuery(
            ("page", options.Page),
            ("pageSize", options.PageSize),
            ("search", options.Search)
        );

        var response = await Http.GetAsync<ArtistListResponse>("/Artists", query, cancellationToken)
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
    /// Iterate through all artists using IAsyncEnumerable.
    /// </summary>
    public async IAsyncEnumerable<ArtistList> ListAllAsync(
        ListArtistsOptions? options = null,
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        options ??= new ListArtistsOptions();
        options.Page = 1;

        var page = await ListAsync(options, cancellationToken).ConfigureAwait(false);

        await foreach (var artist in page.WithCancellation(cancellationToken))
        {
            yield return artist;
        }
    }
}
