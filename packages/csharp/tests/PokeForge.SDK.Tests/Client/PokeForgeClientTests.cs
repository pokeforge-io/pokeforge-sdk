namespace PokeForge.SDK.Tests.Client;

using System.Net;
using FluentAssertions;
using RichardSzalay.MockHttp;
using Xunit;
using PokeForge.SDK.Client;
using PokeForge.SDK.Tests.Fixtures;

public class PokeForgeClientTests : IDisposable
{
    private readonly MockHttpMessageHandler _mockHttp;
    private readonly PokeForgeClient _client;

    public PokeForgeClientTests()
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
    public void Should_Initialize_All_Resources()
    {
        _client.Cards.Should().NotBeNull();
        _client.Sets.Should().NotBeNull();
        _client.Series.Should().NotBeNull();
        _client.Collections.Should().NotBeNull();
        _client.Favorites.Should().NotBeNull();
        _client.Artists.Should().NotBeNull();
        _client.Blog.Should().NotBeNull();
    }

    [Fact]
    public async Task HealthAsync_Should_Succeed()
    {
        _mockHttp.When("/health")
            .Respond(HttpStatusCode.OK);

        await _client.Invoking(c => c.HealthAsync())
            .Should().NotThrowAsync();
    }

    [Fact]
    public void WithOptions_Should_Create_New_Client_With_Updated_Config()
    {
        var newClient = _client.WithOptions(opts =>
        {
            opts.AuthToken = "new-token";
            opts.Timeout = TimeSpan.FromSeconds(60);
        });

        newClient.Should().NotBeSameAs(_client);
    }

    [Fact]
    public async Task Should_Include_Auth_Header_When_Token_Provided()
    {
        var mockHttp = new MockHttpMessageHandler();
        using var authClient = new PokeForgeClient(new PokeForgeClientOptions
        {
            BaseUrl = "https://api.pokeforge.gg",
            AuthToken = "test-token",
            HttpClient = new HttpClient(mockHttp) { BaseAddress = new Uri("https://api.pokeforge.gg") }
        });

        mockHttp.When("/Collections")
            .With(r => r.Headers.Authorization?.Parameter == "test-token")
            .RespondWithJson(new { success = true, data = Array.Empty<object>() });

        var collections = await authClient.Collections.ListAsync();

        collections.Should().NotBeNull();
        mockHttp.VerifyNoOutstandingExpectation();
    }

    [Fact]
    public async Task Should_Use_Dynamic_Token_Provider()
    {
        var mockHttp = new MockHttpMessageHandler();
        var tokenCallCount = 0;

        using var authClient = new PokeForgeClient(new PokeForgeClientOptions
        {
            BaseUrl = "https://api.pokeforge.gg",
            TokenProvider = _ =>
            {
                tokenCallCount++;
                return Task.FromResult($"dynamic-token-{tokenCallCount}");
            },
            HttpClient = new HttpClient(mockHttp) { BaseAddress = new Uri("https://api.pokeforge.gg") }
        });

        mockHttp.When("/Collections")
            .With(r => r.Headers.Authorization?.Parameter == "dynamic-token-1")
            .RespondWithJson(new { success = true, data = Array.Empty<object>() });

        await authClient.Collections.ListAsync();

        tokenCallCount.Should().Be(1);
    }
}
