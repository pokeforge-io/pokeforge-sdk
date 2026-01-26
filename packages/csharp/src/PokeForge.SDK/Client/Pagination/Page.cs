namespace PokeForge.SDK.Client.Pagination;

using System.Runtime.CompilerServices;

/// <summary>
/// Delegate for fetching a page of results.
/// </summary>
/// <typeparam name="T">The type of items in the page.</typeparam>
/// <param name="page">The page number to fetch.</param>
/// <param name="pageSize">The number of items per page.</param>
/// <param name="cancellationToken">Cancellation token.</param>
/// <returns>A page of results.</returns>
public delegate Task<Page<T>> PageFetcher<T>(int page, int pageSize, CancellationToken cancellationToken);

/// <summary>
/// Represents a page of results with support for async iteration across all pages.
/// </summary>
/// <typeparam name="T">The type of items in the page.</typeparam>
public sealed class Page<T> : IAsyncEnumerable<T>
{
    private readonly IReadOnlyList<T> _data;
    private readonly PageFetcher<T> _fetcher;

    /// <summary>
    /// Creates a new page of results.
    /// </summary>
    public Page(IReadOnlyList<T> data, PageInfo pagination, PageFetcher<T> fetcher)
    {
        _data = data;
        Pagination = pagination;
        _fetcher = fetcher;
    }

    /// <summary>
    /// Items on this page.
    /// </summary>
    public IReadOnlyList<T> Data => _data;

    /// <summary>
    /// Pagination metadata.
    /// </summary>
    public PageInfo Pagination { get; }

    /// <summary>
    /// Fetches the next page, or null if there is no next page.
    /// </summary>
    public async Task<Page<T>?> NextPageAsync(CancellationToken cancellationToken = default)
    {
        if (!Pagination.HasNext) return null;
        return await _fetcher(Pagination.Page + 1, Pagination.PageSize, cancellationToken)
            .ConfigureAwait(false);
    }

    /// <summary>
    /// Fetches the previous page, or null if there is no previous page.
    /// </summary>
    public async Task<Page<T>?> PreviousPageAsync(CancellationToken cancellationToken = default)
    {
        if (!Pagination.HasPrevious) return null;
        return await _fetcher(Pagination.Page - 1, Pagination.PageSize, cancellationToken)
            .ConfigureAwait(false);
    }

    /// <summary>
    /// Navigates to a specific page number.
    /// </summary>
    public async Task<Page<T>> GoToPageAsync(int page, CancellationToken cancellationToken = default)
    {
        return await _fetcher(page, Pagination.PageSize, cancellationToken)
            .ConfigureAwait(false);
    }

    /// <summary>
    /// Collects all items from all pages into a list.
    /// </summary>
    public async Task<IReadOnlyList<T>> ToListAsync(CancellationToken cancellationToken = default)
    {
        var allItems = new List<T>(_data);
        var currentPage = this;

        while (currentPage.Pagination.HasNext)
        {
            currentPage = await currentPage.NextPageAsync(cancellationToken).ConfigureAwait(false);
            if (currentPage is null) break;
            allItems.AddRange(currentPage.Data);
        }

        return allItems;
    }

    /// <summary>
    /// Gets an async enumerator that iterates over all items across all pages.
    /// </summary>
    public async IAsyncEnumerator<T> GetAsyncEnumerator(
        CancellationToken cancellationToken = default)
    {
        // Yield items from current page
        foreach (var item in _data)
        {
            yield return item;
        }

        // Fetch and yield from subsequent pages
        var currentPage = this;
        while (currentPage.Pagination.HasNext)
        {
            currentPage = await currentPage.NextPageAsync(cancellationToken).ConfigureAwait(false);
            if (currentPage is null) break;

            foreach (var item in currentPage.Data)
            {
                yield return item;
            }
        }
    }
}
