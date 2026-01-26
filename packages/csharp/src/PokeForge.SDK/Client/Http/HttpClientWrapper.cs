namespace PokeForge.SDK.Client.Http;

using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using PokeForge.SDK.Exceptions;
using PokeForge.SDK.Generated;

/// <summary>
/// HTTP client wrapper with retry logic, timeout handling, and authentication.
/// </summary>
internal sealed class HttpClientWrapper : IDisposable
{
    private readonly HttpClient _httpClient;
    private readonly TokenManager _tokenManager;
    private readonly PokeForgeClientOptions _options;
    private readonly bool _ownsHttpClient;
    private bool _disposed;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true
    };

    public HttpClientWrapper(PokeForgeClientOptions options)
    {
        _options = options;
        _tokenManager = new TokenManager(options.AuthToken, options.TokenProvider);

        if (options.HttpClient is not null)
        {
            _httpClient = options.HttpClient;
            _ownsHttpClient = false;
        }
        else
        {
            _httpClient = new HttpClient
            {
                BaseAddress = new Uri(options.BaseUrl.TrimEnd('/')),
                Timeout = Timeout.InfiniteTimeSpan // We handle timeout ourselves
            };
            _ownsHttpClient = true;
        }
    }

    /// <summary>
    /// Gets the current configuration options.
    /// </summary>
    public PokeForgeClientOptions Options => _options;

    /// <summary>
    /// Performs a GET request.
    /// </summary>
    public async Task<T?> GetAsync<T>(
        string path,
        IDictionary<string, string?>? query = null,
        CancellationToken cancellationToken = default)
    {
        return await RequestAsync<T>(HttpMethod.Get, path, query, body: null, cancellationToken)
            .ConfigureAwait(false);
    }

    /// <summary>
    /// Performs a POST request.
    /// </summary>
    public async Task<T?> PostAsync<T>(
        string path,
        object? body = null,
        CancellationToken cancellationToken = default)
    {
        return await RequestAsync<T>(HttpMethod.Post, path, query: null, body, cancellationToken)
            .ConfigureAwait(false);
    }

    /// <summary>
    /// Performs a PUT request.
    /// </summary>
    public async Task<T?> PutAsync<T>(
        string path,
        object? body = null,
        CancellationToken cancellationToken = default)
    {
        return await RequestAsync<T>(HttpMethod.Put, path, query: null, body, cancellationToken)
            .ConfigureAwait(false);
    }

    /// <summary>
    /// Performs a DELETE request.
    /// </summary>
    public async Task DeleteAsync(
        string path,
        CancellationToken cancellationToken = default)
    {
        await RequestAsync<object>(HttpMethod.Delete, path, query: null, body: null, cancellationToken)
            .ConfigureAwait(false);
    }

    private async Task<T?> RequestAsync<T>(
        HttpMethod method,
        string path,
        IDictionary<string, string?>? query,
        object? body,
        CancellationToken cancellationToken)
    {
        var url = BuildUrl(path, query);
        var maxAttempts = _options.MaxRetries + 1;

        for (var attempt = 1; attempt <= maxAttempts; attempt++)
        {
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            cts.CancelAfter(_options.Timeout);

            try
            {
                using var request = new HttpRequestMessage(method, url);
                await AddHeadersAsync(request, cancellationToken).ConfigureAwait(false);

                if (body is not null)
                {
                    request.Content = JsonContent.Create(body, options: JsonOptions);
                }

                using var response = await _httpClient.SendAsync(request, cts.Token)
                    .ConfigureAwait(false);

                if (response.IsSuccessStatusCode)
                {
                    if (response.StatusCode == HttpStatusCode.NoContent ||
                        response.StatusCode == HttpStatusCode.Accepted)
                    {
                        return default;
                    }

                    var contentType = response.Content.Headers.ContentType?.MediaType;
                    if (contentType?.Contains("application/json") == true)
                    {
                        return await response.Content.ReadFromJsonAsync<T>(JsonOptions, cancellationToken)
                            .ConfigureAwait(false);
                    }

                    return default;
                }

                var error = await HandleErrorResponseAsync(response, cancellationToken)
                    .ConfigureAwait(false);

                // Retry on 429 (rate limit) or 5xx (server errors)
                if (attempt < maxAttempts &&
                    (response.StatusCode == HttpStatusCode.TooManyRequests ||
                     (int)response.StatusCode >= 500))
                {
                    var delay = CalculateDelay(attempt, error);
                    await Task.Delay(delay, cancellationToken).ConfigureAwait(false);
                    continue;
                }

                throw error;
            }
            catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
            {
                // Our timeout triggered, not the caller's cancellation
                throw new PokeForgeTimeoutException(
                    $"Request timed out after {_options.Timeout.TotalSeconds}s");
            }
            catch (HttpRequestException ex)
            {
                if (attempt < maxAttempts)
                {
                    var delay = CalculateDelay(attempt);
                    await Task.Delay(delay, cancellationToken).ConfigureAwait(false);
                    continue;
                }
                throw new NetworkException("Network error", ex);
            }
            catch (PokeForgeException)
            {
                throw;
            }
        }

        throw new NetworkException("Request failed after all retry attempts");
    }

    private string BuildUrl(string path, IDictionary<string, string?>? query)
    {
        if (query is null || query.Count == 0)
        {
            return path;
        }

        var queryParams = query
            .Where(kv => kv.Value is not null)
            .Select(kv => $"{Uri.EscapeDataString(kv.Key)}={Uri.EscapeDataString(kv.Value!)}");

        var queryString = string.Join("&", queryParams);
        return $"{path}?{queryString}";
    }

    private async Task AddHeadersAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        var token = await _tokenManager.GetTokenAsync(cancellationToken).ConfigureAwait(false);
        if (token is not null)
        {
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        }
    }

    private async Task<PokeForgeException> HandleErrorResponseAsync(
        HttpResponseMessage response,
        CancellationToken cancellationToken)
    {
        ProblemDetails? problemDetails = null;
        try
        {
            problemDetails = await response.Content
                .ReadFromJsonAsync<ProblemDetails>(JsonOptions, cancellationToken)
                .ConfigureAwait(false);
        }
        catch
        {
            // Response body might not be valid JSON
        }

        if (response.StatusCode == HttpStatusCode.TooManyRequests)
        {
            int? retryAfterMs = null;
            if (response.Headers.RetryAfter?.Delta is TimeSpan delta)
            {
                retryAfterMs = (int)delta.TotalMilliseconds;
            }
            else if (response.Headers.RetryAfter?.Date is DateTimeOffset date)
            {
                retryAfterMs = (int)(date - DateTimeOffset.UtcNow).TotalMilliseconds;
                if (retryAfterMs < 0) retryAfterMs = null;
            }

            return new RateLimitException(
                problemDetails?.Title ?? "Rate limit exceeded",
                problemDetails,
                retryAfterMs);
        }

        return PokeForgeException.FromResponse((int)response.StatusCode, problemDetails);
    }

    private TimeSpan CalculateDelay(int attempt, PokeForgeException? error = null)
    {
        // If we have a retry-after hint from rate limiting, use it
        if (error is RateLimitException { RetryAfterMs: not null } rateLimitError)
        {
            var retryDelay = TimeSpan.FromMilliseconds(rateLimitError.RetryAfterMs.Value);
            var maxDelay = _options.RetryDelay.MaxDelay;
            return retryDelay < maxDelay ? retryDelay : maxDelay;
        }

        if (_options.RetryDelay.Exponential)
        {
            // Exponential backoff: base * 2^(attempt-1)
            var multiplier = Math.Pow(2, attempt - 1);
            var delayMs = _options.RetryDelay.BaseDelay.TotalMilliseconds * multiplier;
            var maxMs = _options.RetryDelay.MaxDelay.TotalMilliseconds;
            return TimeSpan.FromMilliseconds(Math.Min(delayMs, maxMs));
        }

        return _options.RetryDelay.BaseDelay;
    }

    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;

        if (_ownsHttpClient)
        {
            _httpClient.Dispose();
        }
    }
}
