namespace PokeForge.SDK.Client;

/// <summary>
/// Configuration options for the PokeForge client.
/// </summary>
public sealed class PokeForgeClientOptions
{
    /// <summary>
    /// Base URL for the API. Defaults to "https://api.pokeforge.gg".
    /// </summary>
    public string BaseUrl { get; set; } = "https://api.pokeforge.gg";

    /// <summary>
    /// Static JWT authentication token.
    /// </summary>
    public string? AuthToken { get; set; }

    /// <summary>
    /// Dynamic token provider for obtaining fresh tokens.
    /// Takes precedence over AuthToken if both are set.
    /// </summary>
    public Func<CancellationToken, Task<string>>? TokenProvider { get; set; }

    /// <summary>
    /// Request timeout. Defaults to 30 seconds.
    /// </summary>
    public TimeSpan Timeout { get; set; } = TimeSpan.FromSeconds(30);

    /// <summary>
    /// Number of retry attempts for failed requests. Defaults to 3.
    /// </summary>
    public int MaxRetries { get; set; } = 3;

    /// <summary>
    /// Retry delay configuration.
    /// </summary>
    public RetryDelayOptions RetryDelay { get; set; } = new();

    /// <summary>
    /// Optional custom HttpClient. If not provided, one will be created internally.
    /// When providing a custom HttpClient, the caller is responsible for its lifecycle.
    /// </summary>
    public HttpClient? HttpClient { get; set; }

    /// <summary>
    /// Creates a copy of these options.
    /// </summary>
    internal PokeForgeClientOptions Clone() => new()
    {
        BaseUrl = BaseUrl,
        AuthToken = AuthToken,
        TokenProvider = TokenProvider,
        Timeout = Timeout,
        MaxRetries = MaxRetries,
        RetryDelay = RetryDelay,
        HttpClient = HttpClient
    };
}

/// <summary>
/// Configuration for retry delay behavior.
/// </summary>
public sealed class RetryDelayOptions
{
    /// <summary>
    /// Base delay between retries. Defaults to 1 second.
    /// </summary>
    public TimeSpan BaseDelay { get; set; } = TimeSpan.FromSeconds(1);

    /// <summary>
    /// Maximum delay between retries. Defaults to 30 seconds.
    /// </summary>
    public TimeSpan MaxDelay { get; set; } = TimeSpan.FromSeconds(30);

    /// <summary>
    /// Whether to use exponential backoff. Defaults to true.
    /// </summary>
    public bool Exponential { get; set; } = true;
}
