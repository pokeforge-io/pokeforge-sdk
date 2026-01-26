namespace PokeForge.SDK.Tests.Client;

using System.Net;
using FluentAssertions;
using RichardSzalay.MockHttp;
using Xunit;
using PokeForge.SDK.Client;
using PokeForge.SDK.Exceptions;
using PokeForge.SDK.Tests.Fixtures;

public class HttpClientWrapperTests : IDisposable
{
    private readonly MockHttpMessageHandler _mockHttp;

    public HttpClientWrapperTests()
    {
        _mockHttp = new MockHttpMessageHandler();
    }

    public void Dispose()
    {
        _mockHttp.Dispose();
    }

    [Fact]
    public async Task Should_Throw_AuthenticationException_On_401()
    {
        using var client = CreateClient();

        _mockHttp.When("/Cards")
            .RespondWithProblemDetails(HttpStatusCode.Unauthorized, "Unauthorized", "Invalid token");

        await client.Cards.Invoking(c => c.ListAsync())
            .Should().ThrowAsync<AuthenticationException>()
            .WithMessage("Unauthorized");
    }

    [Fact]
    public async Task Should_Throw_ForbiddenException_On_403()
    {
        using var client = CreateClient();

        _mockHttp.When("/Cards")
            .RespondWithProblemDetails(HttpStatusCode.Forbidden, "Forbidden", "Access denied");

        await client.Cards.Invoking(c => c.ListAsync())
            .Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task Should_Throw_ValidationException_On_400()
    {
        using var client = CreateClient();

        _mockHttp.When("/Cards")
            .RespondWithProblemDetails(HttpStatusCode.BadRequest, "Bad Request", "Invalid parameters");

        await client.Cards.Invoking(c => c.ListAsync())
            .Should().ThrowAsync<ValidationException>();
    }

    [Fact]
    public async Task Should_Throw_RateLimitException_On_429()
    {
        using var client = CreateClient();

        _mockHttp.When("/Cards")
            .RespondWithProblemDetails(HttpStatusCode.TooManyRequests, "Rate Limited", "Too many requests");

        await client.Cards.Invoking(c => c.ListAsync())
            .Should().ThrowAsync<RateLimitException>();
    }

    [Fact]
    public async Task Should_Throw_TimeoutException_When_Request_Times_Out()
    {
        using var client = new PokeForgeClient(new PokeForgeClientOptions
        {
            BaseUrl = "https://api.pokeforge.gg",
            Timeout = TimeSpan.FromMilliseconds(100),
            MaxRetries = 0,
            HttpClient = new HttpClient(_mockHttp) { BaseAddress = new Uri("https://api.pokeforge.gg") }
        });

        _mockHttp.When("/Cards")
            .Respond(async () =>
            {
                await Task.Delay(500);
                return new HttpResponseMessage(HttpStatusCode.OK);
            });

        await client.Cards.Invoking(c => c.ListAsync())
            .Should().ThrowAsync<PokeForgeTimeoutException>();
    }

    [Fact]
    public async Task Should_Retry_On_Server_Error()
    {
        using var client = new PokeForgeClient(new PokeForgeClientOptions
        {
            BaseUrl = "https://api.pokeforge.gg",
            MaxRetries = 2,
            RetryDelay = new RetryDelayOptions { BaseDelay = TimeSpan.FromMilliseconds(10) },
            HttpClient = new HttpClient(_mockHttp) { BaseAddress = new Uri("https://api.pokeforge.gg") }
        });

        var requestCount = 0;

        _mockHttp.When("/Cards")
            .Respond(_ =>
            {
                requestCount++;
                if (requestCount < 3)
                {
                    return new HttpResponseMessage(HttpStatusCode.InternalServerError);
                }
                return new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent("{\"success\":true,\"data\":[],\"pagination\":{\"page\":1,\"pageSize\":20,\"totalCount\":0,\"totalPages\":0,\"hasNext\":false,\"hasPrevious\":false}}")
                    {
                        Headers = { ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/json") }
                    }
                };
            });

        var result = await client.Cards.ListAsync();

        requestCount.Should().Be(3);
        result.Data.Should().BeEmpty();
    }

    [Fact]
    public async Task Should_Respect_MaxRetries_Setting()
    {
        using var client = new PokeForgeClient(new PokeForgeClientOptions
        {
            BaseUrl = "https://api.pokeforge.gg",
            MaxRetries = 1,
            RetryDelay = new RetryDelayOptions { BaseDelay = TimeSpan.FromMilliseconds(10) },
            HttpClient = new HttpClient(_mockHttp) { BaseAddress = new Uri("https://api.pokeforge.gg") }
        });

        var requestCount = 0;

        _mockHttp.When("/Cards")
            .Respond(_ =>
            {
                requestCount++;
                return new HttpResponseMessage(HttpStatusCode.InternalServerError);
            });

        await client.Cards.Invoking(c => c.ListAsync())
            .Should().ThrowAsync<PokeForgeException>();

        requestCount.Should().Be(2); // 1 initial + 1 retry
    }

    private PokeForgeClient CreateClient()
    {
        return new PokeForgeClient(new PokeForgeClientOptions
        {
            BaseUrl = "https://api.pokeforge.gg",
            MaxRetries = 0, // Disable retries for error tests
            HttpClient = new HttpClient(_mockHttp) { BaseAddress = new Uri("https://api.pokeforge.gg") }
        });
    }
}
