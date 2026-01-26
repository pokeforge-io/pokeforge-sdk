namespace PokeForge.SDK.Client.Resources;

using PokeForge.SDK.Client.Http;
using PokeForge.SDK.Client.Pagination;
using PokeForge.SDK.Generated;

/// <summary>
/// Abstract base class for all API resource classes.
/// </summary>
public abstract class BaseResource
{
    private readonly HttpClientWrapper _http;

    /// <summary>
    /// Gets the HTTP client wrapper for making API requests.
    /// </summary>
    private protected HttpClientWrapper Http => _http;

    /// <summary>
    /// Creates a new resource with the specified HTTP client.
    /// </summary>
    private protected BaseResource(HttpClientWrapper http)
    {
        _http = http;
    }

    /// <summary>
    /// Creates a paginated response from an API response.
    /// </summary>
    protected Page<T> CreatePagedResponse<T, TResponse>(
        TResponse response,
        Func<TResponse, IReadOnlyList<T>?> dataSelector,
        Func<TResponse, PaginationInfo?> paginationSelector,
        PageFetcher<T> fetcher)
        where TResponse : class
    {
        var data = dataSelector(response) ?? Array.Empty<T>();
        var paginationInfo = paginationSelector(response);

        var pageInfo = new PageInfo
        {
            Page = paginationInfo?.Page ?? 1,
            PageSize = paginationInfo?.PageSize ?? data.Count,
            TotalCount = paginationInfo?.TotalCount ?? data.Count,
            TotalPages = paginationInfo?.TotalPages ?? 1,
            HasNext = paginationInfo?.HasNext ?? false,
            HasPrevious = paginationInfo?.HasPrevious ?? false
        };

        return new Page<T>(data, pageInfo, fetcher);
    }

    /// <summary>
    /// Builds a query parameter dictionary, filtering out null values.
    /// </summary>
    protected static Dictionary<string, string?> BuildQuery(params (string key, object? value)[] parameters)
    {
        var query = new Dictionary<string, string?>();

        foreach (var (key, value) in parameters)
        {
            if (value is null) continue;

            var stringValue = value switch
            {
                string s => s,
                int i => i.ToString(),
                long l => l.ToString(),
                bool b => b.ToString().ToLowerInvariant(),
                Enum e => e.ToString(),
                IEnumerable<string> arr => string.Join(",", arr),
                _ => value.ToString()
            };

            if (!string.IsNullOrEmpty(stringValue))
            {
                query[key] = stringValue;
            }
        }

        return query;
    }
}

/// <summary>
/// Base options for paginated list operations.
/// </summary>
public class PaginationOptions
{
    /// <summary>
    /// Page number (1-indexed). Defaults to 1.
    /// </summary>
    public int? Page { get; set; }

    /// <summary>
    /// Number of items per page. Defaults to 20.
    /// </summary>
    public int? PageSize { get; set; }
}
