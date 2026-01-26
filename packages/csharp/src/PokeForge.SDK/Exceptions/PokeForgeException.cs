namespace PokeForge.SDK.Exceptions;

using PokeForge.SDK.Generated;

/// <summary>
/// Base exception for all PokeForge API errors.
/// </summary>
public class PokeForgeException : Exception
{
    /// <summary>
    /// HTTP status code of the error response.
    /// </summary>
    public int StatusCode { get; }

    /// <summary>
    /// Error type URI from the API response.
    /// </summary>
    public string? ErrorType { get; }

    /// <summary>
    /// Detailed error message from the API.
    /// </summary>
    public string? Detail { get; }

    /// <summary>
    /// URI reference that identifies the specific occurrence of the problem.
    /// </summary>
    public string? Instance { get; }

    /// <summary>
    /// The full problem details from the API response.
    /// </summary>
    public ProblemDetails? ProblemDetails { get; }

    /// <summary>
    /// Creates a new PokeForgeException.
    /// </summary>
    public PokeForgeException(string message, int statusCode = 0, ProblemDetails? problemDetails = null)
        : base(message)
    {
        StatusCode = statusCode;
        ErrorType = problemDetails?.Type;
        Detail = problemDetails?.Detail;
        Instance = problemDetails?.Instance;
        ProblemDetails = problemDetails;
    }

    /// <summary>
    /// Creates a new PokeForgeException with an inner exception.
    /// </summary>
    public PokeForgeException(string message, Exception innerException)
        : base(message, innerException)
    {
        StatusCode = 0;
    }

    /// <summary>
    /// Creates the appropriate exception type based on the HTTP status code.
    /// </summary>
    public static PokeForgeException FromResponse(int statusCode, ProblemDetails? problemDetails)
    {
        var message = problemDetails?.Title ?? problemDetails?.Detail ?? $"HTTP {statusCode} error";

        return statusCode switch
        {
            400 => new ValidationException(message, problemDetails),
            401 => new AuthenticationException(message, problemDetails),
            403 => new ForbiddenException(message, problemDetails),
            404 => new NotFoundException(message, problemDetails),
            429 => new RateLimitException(message, problemDetails),
            _ => new PokeForgeException(message, statusCode, problemDetails)
        };
    }
}

/// <summary>
/// Exception thrown when a requested resource is not found (HTTP 404).
/// </summary>
public class NotFoundException : PokeForgeException
{
    public NotFoundException(string message, ProblemDetails? problemDetails = null)
        : base(message, 404, problemDetails)
    {
    }
}

/// <summary>
/// Exception thrown when authentication fails (HTTP 401).
/// </summary>
public class AuthenticationException : PokeForgeException
{
    public AuthenticationException(string message, ProblemDetails? problemDetails = null)
        : base(message, 401, problemDetails)
    {
    }
}

/// <summary>
/// Exception thrown when access is forbidden (HTTP 403).
/// </summary>
public class ForbiddenException : PokeForgeException
{
    public ForbiddenException(string message, ProblemDetails? problemDetails = null)
        : base(message, 403, problemDetails)
    {
    }
}

/// <summary>
/// Exception thrown when request validation fails (HTTP 400).
/// </summary>
public class ValidationException : PokeForgeException
{
    /// <summary>
    /// Field-level validation errors.
    /// </summary>
    public IDictionary<string, string[]>? Errors { get; }

    public ValidationException(string message, ProblemDetails? problemDetails = null)
        : base(message, 400, problemDetails)
    {
        Errors = problemDetails?.Errors;
    }
}

/// <summary>
/// Exception thrown when rate limit is exceeded (HTTP 429).
/// </summary>
public class RateLimitException : PokeForgeException
{
    /// <summary>
    /// Suggested retry delay in milliseconds, if provided by the API.
    /// </summary>
    public int? RetryAfterMs { get; internal set; }

    public RateLimitException(string message, ProblemDetails? problemDetails = null, int? retryAfterMs = null)
        : base(message, 429, problemDetails)
    {
        RetryAfterMs = retryAfterMs;
    }
}

/// <summary>
/// Exception thrown when a request times out.
/// </summary>
public class PokeForgeTimeoutException : PokeForgeException
{
    public PokeForgeTimeoutException(string message = "Request timed out")
        : base(message, 0)
    {
    }
}

/// <summary>
/// Exception thrown when a network error occurs.
/// </summary>
public class NetworkException : PokeForgeException
{
    public NetworkException(string message = "Network error", Exception? innerException = null)
        : base(message, innerException ?? new Exception(message))
    {
    }
}
