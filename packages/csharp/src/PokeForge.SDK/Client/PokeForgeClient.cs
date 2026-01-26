namespace PokeForge.SDK.Client;

using PokeForge.SDK.Client.Http;
using PokeForge.SDK.Client.Resources;

/// <summary>
/// The main PokeForge API client.
/// </summary>
/// <example>
/// <code>
/// using var client = new PokeForgeClient(new PokeForgeClientOptions
/// {
///     AuthToken = "your-jwt-token"
/// });
///
/// // List cards with pagination
/// var page = await client.Cards.ListAsync(new ListCardsOptions { Rarity = "Rare" });
///
/// // Iterate through all cards
/// await foreach (var card in client.Cards.ListAllAsync(new ListCardsOptions { Search = "Pikachu" }))
/// {
///     Console.WriteLine(card.Name);
/// }
/// </code>
/// </example>
public sealed class PokeForgeClient : IDisposable
{
    private readonly HttpClientWrapper _http;
    private bool _disposed;

    /// <summary>
    /// Cards API - browse and search Pokemon cards.
    /// </summary>
    public CardsResource Cards { get; }

    /// <summary>
    /// Sets API - browse card sets.
    /// </summary>
    public SetsResource Sets { get; }

    /// <summary>
    /// Series API - browse card series.
    /// </summary>
    public SeriesResource Series { get; }

    /// <summary>
    /// Collections API - manage user card collections.
    /// Requires authentication.
    /// </summary>
    public CollectionsResource Collections { get; }

    /// <summary>
    /// Favorites API - manage favorite cards.
    /// Requires authentication.
    /// </summary>
    public FavoritesResource Favorites { get; }

    /// <summary>
    /// Artists API - browse card artists.
    /// </summary>
    public ArtistsResource Artists { get; }

    /// <summary>
    /// Blog API - read blog posts.
    /// </summary>
    public BlogResource Blog { get; }

    /// <summary>
    /// Creates a new PokeForge client with default options.
    /// </summary>
    public PokeForgeClient() : this(new PokeForgeClientOptions())
    {
    }

    /// <summary>
    /// Creates a new PokeForge client with the specified options.
    /// </summary>
    /// <param name="options">Client configuration options.</param>
    public PokeForgeClient(PokeForgeClientOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        _http = new HttpClientWrapper(options);

        Cards = new CardsResource(_http);
        Sets = new SetsResource(_http);
        Series = new SeriesResource(_http);
        Collections = new CollectionsResource(_http);
        Favorites = new FavoritesResource(_http);
        Artists = new ArtistsResource(_http);
        Blog = new BlogResource(_http);
    }

    /// <summary>
    /// Creates a new client with updated configuration.
    /// The original client is not affected.
    /// </summary>
    /// <param name="configure">Action to configure the new options.</param>
    /// <returns>A new client with the updated configuration.</returns>
    public PokeForgeClient WithOptions(Action<PokeForgeClientOptions> configure)
    {
        var newOptions = _http.Options.Clone();
        configure(newOptions);
        return new PokeForgeClient(newOptions);
    }

    /// <summary>
    /// Performs a health check against the API.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token.</param>
    public async Task HealthAsync(CancellationToken cancellationToken = default)
    {
        await _http.GetAsync<object>("/health", cancellationToken: cancellationToken)
            .ConfigureAwait(false);
    }

    /// <summary>
    /// Disposes the client and releases resources.
    /// If a custom HttpClient was provided, it is NOT disposed.
    /// </summary>
    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;
        _http.Dispose();
    }
}
