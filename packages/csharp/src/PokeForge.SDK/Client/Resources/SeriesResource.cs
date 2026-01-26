namespace PokeForge.SDK.Client.Resources;

using System.Runtime.CompilerServices;
using PokeForge.SDK.Client.Http;
using PokeForge.SDK.Client.Pagination;
using PokeForge.SDK.Exceptions;
using PokeForge.SDK.Generated;

/// <summary>
/// Options for listing series.
/// </summary>
public sealed class ListSeriesOptions : PaginationOptions
{
    /// <summary>
    /// Sort field.
    /// </summary>
    public string? SortBy { get; set; }

    /// <summary>
    /// Sort order (asc or desc).
    /// </summary>
    public string? SortOrder { get; set; }

    /// <summary>
    /// Search by series name.
    /// </summary>
    public string? Search { get; set; }

    internal ListSeriesOptions Clone() => new()
    {
        Page = Page,
        PageSize = PageSize,
        SortBy = SortBy,
        SortOrder = SortOrder,
        Search = Search
    };
}

/// <summary>
/// Series API - browse card series.
/// </summary>
public sealed class SeriesResource : BaseResource
{
    internal SeriesResource(HttpClientWrapper http) : base(http)
    {
    }

    /// <summary>
    /// Get all series with optional filtering and pagination.
    /// </summary>
    public async Task<Page<SeriesList>> ListAsync(
        ListSeriesOptions? options = null,
        CancellationToken cancellationToken = default)
    {
        options ??= new ListSeriesOptions();

        var query = BuildQuery(
            ("page", options.Page),
            ("pageSize", options.PageSize),
            ("sortBy", options.SortBy),
            ("sortOrder", options.SortOrder),
            ("search", options.Search)
        );

        var response = await Http.GetAsync<SeriesListResponse>("/Series", query, cancellationToken)
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
    /// Get a single series by ID with full details including sets.
    /// </summary>
    public async Task<SeriesDetail> GetAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var response = await Http.GetAsync<SeriesSingleResponse>($"/Series/{id}", cancellationToken: cancellationToken)
            .ConfigureAwait(false);

        return response?.Data ?? throw new NotFoundException("Series not found");
    }

    /// <summary>
    /// Iterate through all series using IAsyncEnumerable.
    /// </summary>
    public async IAsyncEnumerable<SeriesList> ListAllAsync(
        ListSeriesOptions? options = null,
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        options ??= new ListSeriesOptions();
        options.Page = 1;

        var page = await ListAsync(options, cancellationToken).ConfigureAwait(false);

        await foreach (var series in page.WithCancellation(cancellationToken))
        {
            yield return series;
        }
    }
}
