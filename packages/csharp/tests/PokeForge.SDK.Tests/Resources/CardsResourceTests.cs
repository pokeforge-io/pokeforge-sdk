namespace PokeForge.SDK.Tests.Resources;

using System.Net;
using FluentAssertions;
using RichardSzalay.MockHttp;
using Xunit;
using PokeForge.SDK.Client;
using PokeForge.SDK.Client.Resources;
using PokeForge.SDK.Exceptions;
using PokeForge.SDK.Tests.Fixtures;

public class CardsResourceTests : IDisposable
{
    private readonly MockHttpMessageHandler _mockHttp;
    private readonly PokeForgeClient _client;

    public CardsResourceTests()
    {
        _mockHttp = new MockHttpMessageHandler();
        _client = new PokeForgeClient(new PokeForgeClientOptions
        {
            BaseUrl = "https://api.pokeforge.gg",
            HttpClient = new HttpClient(_mockHttp) { BaseAddress = new Uri("https://api.pokeforge.gg") }
        });
    }

    public void Dispose()
    {
        _client.Dispose();
        _mockHttp.Dispose();
    }

    [Fact]
    public async Task ListAsync_Should_Return_Page_Of_Cards()
    {
        var cardId = Guid.NewGuid();
        _mockHttp.When("/Cards")
            .RespondWithJson(new
            {
                success = true,
                data = new[]
                {
                    new { id = cardId, name = "Pikachu", number = "025", setName = "Base Set" }
                },
                pagination = new
                {
                    page = 1,
                    pageSize = 20,
                    totalCount = 1,
                    totalPages = 1,
                    hasNext = false,
                    hasPrevious = false
                }
            });

        var page = await _client.Cards.ListAsync();

        page.Data.Should().HaveCount(1);
        page.Data[0].Name.Should().Be("Pikachu");
        page.Data[0].Number.Should().Be("025");
        page.Pagination.TotalCount.Should().Be(1);
    }

    [Fact]
    public async Task ListAsync_Should_Include_Filter_Parameters()
    {
        _mockHttp.When("/Cards")
            .WithQueryString("rarity", "Rare")
            .WithQueryString("search", "Charizard")
            .RespondWithJson(new
            {
                success = true,
                data = Array.Empty<object>(),
                pagination = new { page = 1, pageSize = 20, totalCount = 0, totalPages = 0, hasNext = false, hasPrevious = false }
            });

        await _client.Cards.ListAsync(new ListCardsOptions
        {
            Rarity = "Rare",
            Search = "Charizard"
        });

        _mockHttp.VerifyNoOutstandingExpectation();
    }

    [Fact]
    public async Task GetAsync_Should_Return_Card_Details()
    {
        var cardId = Guid.NewGuid();
        _mockHttp.When($"/Cards/{cardId}")
            .RespondWithJson(new
            {
                success = true,
                data = new
                {
                    id = cardId,
                    name = "Pikachu",
                    number = "025",
                    rarity = "Common",
                    set = new { id = Guid.NewGuid(), name = "Base Set" }
                }
            });

        var card = await _client.Cards.GetAsync(cardId);

        card.Name.Should().Be("Pikachu");
        card.Rarity.Should().Be("Common");
    }

    [Fact]
    public async Task GetAsync_Should_Throw_NotFoundException_When_Card_Not_Found()
    {
        var cardId = Guid.NewGuid();
        _mockHttp.When($"/Cards/{cardId}")
            .RespondWithProblemDetails(HttpStatusCode.NotFound, "Not Found", "Card not found");

        await _client.Cards.Invoking(c => c.GetAsync(cardId))
            .Should().ThrowAsync<NotFoundException>()
            .WithMessage("Not Found");
    }

    [Fact]
    public async Task SearchAsync_Should_Return_Matching_Cards()
    {
        _mockHttp.When("/Cards/search")
            .WithQueryString("q", "Pikachu")
            .RespondWithJson(new
            {
                success = true,
                data = new[]
                {
                    new { id = Guid.NewGuid(), name = "Pikachu", number = "025" }
                },
                pagination = new { page = 1, pageSize = 20, totalCount = 1, totalPages = 1, hasNext = false, hasPrevious = false },
                query = "Pikachu"
            });

        var page = await _client.Cards.SearchAsync(new SearchCardsOptions { Query = "Pikachu" });

        page.Data.Should().HaveCount(1);
        page.Data[0].Name.Should().Be("Pikachu");
    }

    [Fact]
    public async Task GetFiltersAsync_Should_Return_Filter_Options()
    {
        _mockHttp.When("/Cards/filters")
            .RespondWithJson(new
            {
                success = true,
                data = new
                {
                    rarities = new[] { "Common", "Uncommon", "Rare" },
                    supertypes = new[] { "Pokemon", "Trainer", "Energy" },
                    types = new[] { "Fire", "Water", "Grass" }
                }
            });

        var filters = await _client.Cards.GetFiltersAsync();

        filters.Rarities.Should().Contain("Rare");
        filters.Supertypes.Should().Contain("Pokemon");
        filters.Types.Should().Contain("Fire");
    }

    [Fact]
    public async Task ListAllAsync_Should_Iterate_Through_All_Pages()
    {
        // First page
        _mockHttp.When("/Cards")
            .WithQueryString("page", "1")
            .RespondWithJson(new
            {
                success = true,
                data = new[]
                {
                    new { id = Guid.NewGuid(), name = "Card1" },
                    new { id = Guid.NewGuid(), name = "Card2" }
                },
                pagination = new { page = 1, pageSize = 2, totalCount = 4, totalPages = 2, hasNext = true, hasPrevious = false }
            });

        // Second page
        _mockHttp.When("/Cards")
            .WithQueryString("page", "2")
            .RespondWithJson(new
            {
                success = true,
                data = new[]
                {
                    new { id = Guid.NewGuid(), name = "Card3" },
                    new { id = Guid.NewGuid(), name = "Card4" }
                },
                pagination = new { page = 2, pageSize = 2, totalCount = 4, totalPages = 2, hasNext = false, hasPrevious = true }
            });

        var cards = new List<string>();
        await foreach (var card in _client.Cards.ListAllAsync(new ListCardsOptions { PageSize = 2 }))
        {
            cards.Add(card.Name!);
        }

        cards.Should().HaveCount(4);
        cards.Should().Contain("Card1");
        cards.Should().Contain("Card4");
    }
}
