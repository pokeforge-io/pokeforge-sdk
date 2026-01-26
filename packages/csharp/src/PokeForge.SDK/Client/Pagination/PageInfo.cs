namespace PokeForge.SDK.Client.Pagination;

/// <summary>
/// Pagination metadata for a page of results.
/// </summary>
public sealed record PageInfo
{
    /// <summary>
    /// Current page number (1-indexed).
    /// </summary>
    public int Page { get; init; }

    /// <summary>
    /// Number of items per page.
    /// </summary>
    public int PageSize { get; init; }

    /// <summary>
    /// Total number of items across all pages.
    /// </summary>
    public int TotalCount { get; init; }

    /// <summary>
    /// Total number of pages.
    /// </summary>
    public int TotalPages { get; init; }

    /// <summary>
    /// Whether there is a next page.
    /// </summary>
    public bool HasNext { get; init; }

    /// <summary>
    /// Whether there is a previous page.
    /// </summary>
    public bool HasPrevious { get; init; }
}
