namespace PokeForge.SDK.Client.Resources;

using System.Runtime.CompilerServices;
using PokeForge.SDK.Client.Http;
using PokeForge.SDK.Client.Pagination;
using PokeForge.SDK.Exceptions;
using PokeForge.SDK.Generated;

/// <summary>
/// Options for listing cards.
/// </summary>
public sealed class ListCardsOptions : PaginationOptions
{
    /// <summary>
    /// Filter by set ID.
    /// </summary>
    public Guid? SetId { get; set; }

    /// <summary>
    /// Filter by series ID.
    /// </summary>
    public Guid? SeriesId { get; set; }

    /// <summary>
    /// Filter by rarity.
    /// </summary>
    public string? Rarity { get; set; }

    /// <summary>
    /// Filter by supertype (Pokemon, Trainer, Energy).
    /// </summary>
    public string? Supertype { get; set; }

    /// <summary>
    /// Filter by subtype.
    /// </summary>
    public string? Subtype { get; set; }

    /// <summary>
    /// Filter by Pokemon type.
    /// </summary>
    public string? PokemonType { get; set; }

    /// <summary>
    /// Filter by artist name.
    /// </summary>
    public string? ArtistName { get; set; }

    /// <summary>
    /// Sort field.
    /// </summary>
    public string? SortBy { get; set; }

    /// <summary>
    /// Sort order (asc or desc).
    /// </summary>
    public string? SortOrder { get; set; }

    /// <summary>
    /// Search by card name.
    /// </summary>
    public string? Search { get; set; }

    internal ListCardsOptions Clone() => new()
    {
        Page = Page,
        PageSize = PageSize,
        SetId = SetId,
        SeriesId = SeriesId,
        Rarity = Rarity,
        Supertype = Supertype,
        Subtype = Subtype,
        PokemonType = PokemonType,
        ArtistName = ArtistName,
        SortBy = SortBy,
        SortOrder = SortOrder,
        Search = Search
    };
}

/// <summary>
/// Options for searching cards.
/// </summary>
public sealed class SearchCardsOptions : PaginationOptions
{
    /// <summary>
    /// Search query (required).
    /// </summary>
    public required string Query { get; set; }

    /// <summary>
    /// Optional filter by set ID.
    /// </summary>
    public Guid? SetId { get; set; }

    internal SearchCardsOptions Clone() => new()
    {
        Query = Query,
        Page = Page,
        PageSize = PageSize,
        SetId = SetId
    };
}

/// <summary>
/// Cards API - browse and search Pokemon cards.
/// </summary>
public sealed class CardsResource : BaseResource
{
    internal CardsResource(HttpClientWrapper http) : base(http)
    {
    }

    /// <summary>
    /// Get all cards with optional filtering, sorting, and pagination.
    /// </summary>
    /// <param name="options">Filter and pagination options.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>A page of cards.</returns>
    public async Task<Page<CardList>> ListAsync(
        ListCardsOptions? options = null,
        CancellationToken cancellationToken = default)
    {
        options ??= new ListCardsOptions();

        var query = BuildQuery(
            ("page", options.Page),
            ("pageSize", options.PageSize),
            ("setId", options.SetId),
            ("seriesId", options.SeriesId),
            ("rarity", options.Rarity),
            ("supertype", options.Supertype),
            ("subtype", options.Subtype),
            ("pokemonType", options.PokemonType),
            ("artistName", options.ArtistName),
            ("sortBy", options.SortBy),
            ("sortOrder", options.SortOrder),
            ("search", options.Search)
        );

        var response = await Http.GetAsync<CardListResponse>("/Cards", query, cancellationToken)
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
    /// Get a single card by ID with full details.
    /// </summary>
    /// <param name="id">Card ID.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The card details.</returns>
    public async Task<CardDetail> GetAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var response = await Http.GetAsync<CardSingleResponse>($"/Cards/{id}", cancellationToken: cancellationToken)
            .ConfigureAwait(false);

        return response?.Data ?? throw new NotFoundException("Card not found");
    }

    /// <summary>
    /// Search cards by name or number.
    /// </summary>
    /// <param name="options">Search options.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>A page of matching cards.</returns>
    public async Task<Page<CardList>> SearchAsync(
        SearchCardsOptions options,
        CancellationToken cancellationToken = default)
    {
        var query = BuildQuery(
            ("q", options.Query),
            ("page", options.Page),
            ("pageSize", options.PageSize),
            ("setId", options.SetId)
        );

        var response = await Http.GetAsync<CardSearchResponse>("/Cards/search", query, cancellationToken)
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
                return await SearchAsync(newOptions, ct).ConfigureAwait(false);
            });
    }

    /// <summary>
    /// Get all variants of a card (Normal, Reverse Holo, etc.).
    /// </summary>
    /// <param name="id">Card ID.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>List of card variants.</returns>
    public async Task<IReadOnlyList<CardVariant>> GetVariantsAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var response = await Http.GetAsync<CardVariantsResponse>($"/Cards/{id}/variants", cancellationToken: cancellationToken)
            .ConfigureAwait(false);

        return response?.Variants ?? Array.Empty<CardVariant>();
    }

    /// <summary>
    /// Get available filter options based on existing card data.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Available filter options.</returns>
    public async Task<CardFilterOptions> GetFiltersAsync(CancellationToken cancellationToken = default)
    {
        var response = await Http.GetAsync<CardFiltersResponse>("/Cards/filters", cancellationToken: cancellationToken)
            .ConfigureAwait(false);

        return response?.Data ?? throw new PokeForgeException("Failed to fetch card filters", 500);
    }

    /// <summary>
    /// Record a view for a card (analytics).
    /// </summary>
    /// <param name="id">Card ID.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    public async Task RecordViewAsync(Guid id, CancellationToken cancellationToken = default)
    {
        await Http.PostAsync<object>($"/Cards/{id}/views", cancellationToken: cancellationToken)
            .ConfigureAwait(false);
    }

    /// <summary>
    /// Iterate through all cards matching criteria using IAsyncEnumerable.
    /// Automatically handles pagination.
    /// </summary>
    /// <param name="options">Filter options.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>An async enumerable of cards.</returns>
    public async IAsyncEnumerable<CardList> ListAllAsync(
        ListCardsOptions? options = null,
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        options ??= new ListCardsOptions();
        options.Page = 1;

        var page = await ListAsync(options, cancellationToken).ConfigureAwait(false);

        await foreach (var card in page.WithCancellation(cancellationToken))
        {
            yield return card;
        }
    }
}
