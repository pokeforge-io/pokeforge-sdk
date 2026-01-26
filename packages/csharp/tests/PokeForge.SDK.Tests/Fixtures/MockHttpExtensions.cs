namespace PokeForge.SDK.Tests.Fixtures;

using System.Net;
using System.Text.Json;
using RichardSzalay.MockHttp;

/// <summary>
/// Extension methods for mocking HTTP responses.
/// </summary>
public static class MockHttpExtensions
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    /// <summary>
    /// Configures the mock request to respond with JSON content.
    /// </summary>
    public static MockedRequest RespondWithJson<T>(
        this MockedRequest request,
        T content,
        HttpStatusCode statusCode = HttpStatusCode.OK)
    {
        var json = JsonSerializer.Serialize(content, JsonOptions);
        return request.Respond(statusCode, "application/json", json);
    }

    /// <summary>
    /// Configures the mock request to respond with a problem details error.
    /// </summary>
    public static MockedRequest RespondWithProblemDetails(
        this MockedRequest request,
        HttpStatusCode statusCode,
        string title,
        string? detail = null)
    {
        var problemDetails = new
        {
            type = $"https://api.pokeforge.gg/errors/{statusCode.ToString().ToLowerInvariant()}",
            title,
            detail,
            status = (int)statusCode
        };

        return request.RespondWithJson(problemDetails, statusCode);
    }
}
