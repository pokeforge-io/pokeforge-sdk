namespace PokeForge.SDK.Client.Http;

/// <summary>
/// Manages authentication tokens for API requests.
/// Supports both static tokens and dynamic token providers.
/// </summary>
internal sealed class TokenManager
{
    private string? _staticToken;
    private Func<CancellationToken, Task<string>>? _tokenProvider;

    /// <summary>
    /// Creates a new TokenManager with optional static token and/or dynamic token provider.
    /// </summary>
    /// <param name="staticToken">A static JWT token.</param>
    /// <param name="tokenProvider">A function that returns a fresh token when called.</param>
    public TokenManager(string? staticToken, Func<CancellationToken, Task<string>>? tokenProvider)
    {
        _staticToken = staticToken;
        _tokenProvider = tokenProvider;
    }

    /// <summary>
    /// Gets the current token. Returns null if no authentication is configured.
    /// If a token provider is configured, it takes precedence over the static token.
    /// </summary>
    public async ValueTask<string?> GetTokenAsync(CancellationToken cancellationToken = default)
    {
        if (_tokenProvider is not null)
        {
            return await _tokenProvider(cancellationToken).ConfigureAwait(false);
        }

        return _staticToken;
    }

    /// <summary>
    /// Updates the static token. Clears any token provider.
    /// Useful for token refresh scenarios.
    /// </summary>
    public void SetToken(string token)
    {
        _staticToken = token;
        _tokenProvider = null;
    }

    /// <summary>
    /// Sets a new token provider. Clears any static token.
    /// </summary>
    public void SetTokenProvider(Func<CancellationToken, Task<string>> tokenProvider)
    {
        _staticToken = null;
        _tokenProvider = tokenProvider;
    }

    /// <summary>
    /// Returns true if any form of authentication is configured.
    /// </summary>
    public bool HasAuth => _staticToken is not null || _tokenProvider is not null;
}
