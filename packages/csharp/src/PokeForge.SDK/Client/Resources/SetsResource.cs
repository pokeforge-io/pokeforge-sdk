namespace PokeForge.SDK.Client.Resources;

using System.Runtime.CompilerServices;
using PokeForge.SDK.Client.Http;
using PokeForge.SDK.Client.Pagination;
using PokeForge.SDK.Exceptions;
using PokeForge.SDK.Generated;

/// <summary>
/// Options for listing sets.
/// </summary>
public sealed class ListSetsOptions : PaginationOptions
{
    /// <summary>
    /// Filter by series ID.
    /// </summary>
    public Guid? SeriesId { get; set; }

    /// <summary>
    /// Sort field.
    /// </summary>
    public string? SortBy { get; set; }

    /// <summary>
    /// Sort order (asc or desc).
    /// </summary>
    public string? SortOrder { get; set; }

    /// <summary>
    /// Search by set name.
    /// </summary>
    public string? Search { get; set; }

    internal ListSetsOptions Clone() => new()
    {
        Page = Page,
        PageSize = PageSize,
        SeriesId = SeriesId,
        SortBy = SortBy,
        SortOrder = SortOrder,
        Search = Search
    };
}

/// <summary>
/// Sets API - browse card sets.
/// </summary>
public sealed class SetsResource : BaseResource
{
    internal SetsResource(HttpClientWrapper http) : base(http)
    {
    }

    /// <summary>
    /// Get all sets with optional filtering and pagination.
    /// </summary>
    public async Task<Page<SetList>> ListAsync(
        ListSetsOptions? options = null,
        CancellationToken cancellationToken = default)
    {
        options ??= new ListSetsOptions();

        var query = BuildQuery(
            ("page", options.Page),
            ("pageSize", options.PageSize),
            ("seriesId", options.SeriesId),
            ("sortBy", options.SortBy),
            ("sortOrder", options.SortOrder),
            ("search", options.Search)
        );

        var response = await Http.GetAsync<SetListResponse>("/Sets", query, cancellationToken)
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
    /// Get a single set by ID with full details.
    /// </summary>
    public async Task<SetDetail> GetAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var response = await Http.GetAsync<SetSingleResponse>($"/Sets/{id}", cancellationToken: cancellationToken)
            .ConfigureAwait(false);

        return response?.Data ?? throw new NotFoundException("Set not found");
    }

    /// <summary>
    /// Iterate through all sets using IAsyncEnumerable.
    /// </summary>
    public async IAsyncEnumerable<SetList> ListAllAsync(
        ListSetsOptions? options = null,
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        options ??= new ListSetsOptions();
        options.Page = 1;

        var page = await ListAsync(options, cancellationToken).ConfigureAwait(false);

        await foreach (var set in page.WithCancellation(cancellationToken))
        {
            yield return set;
        }
    }
}
