"""Custom exceptions for the PokeForge SDK."""

from __future__ import annotations

from typing import Any, Optional

from pokeforge_sdk.generated.models.problem_details import ProblemDetails


class PokeForgeError(Exception):
    """Base error class for all PokeForge API errors."""

    def __init__(
        self,
        message: str,
        status: int,
        problem_details: Optional[ProblemDetails] = None,
    ) -> None:
        super().__init__(message)
        self.status = status
        self.type = problem_details.type if problem_details else None
        self.detail = problem_details.detail if problem_details else None
        self.instance = problem_details.instance if problem_details else None
        self.raw = problem_details

    @classmethod
    def from_response(
        cls, status: int, body: Optional[dict[str, Any]] = None
    ) -> PokeForgeError:
        """Factory method to create appropriate error from HTTP response."""
        pd = ProblemDetails.model_validate(body) if body else None
        message = (
            (pd.title if pd and pd.title else None)
            or (pd.detail if pd and pd.detail else None)
            or f"HTTP {status} error"
        )

        error_map: dict[int, type[PokeForgeError]] = {
            400: ValidationError,
            401: AuthenticationError,
            403: ForbiddenError,
            404: NotFoundError,
            429: RateLimitError,
        }

        error_class = error_map.get(status, PokeForgeError)
        if error_class == RateLimitError:
            return RateLimitError(message, pd)
        if error_class == ValidationError:
            return ValidationError(message, pd)
        if error_class == NotFoundError:
            return NotFoundError(message, pd)
        if error_class == AuthenticationError:
            return AuthenticationError(message, pd)
        if error_class == ForbiddenError:
            return ForbiddenError(message, pd)
        return error_class(message, status, pd)


class NotFoundError(PokeForgeError):
    """Resource not found (404)."""

    def __init__(
        self, message: str, problem_details: Optional[ProblemDetails] = None
    ) -> None:
        super().__init__(message, 404, problem_details)


class AuthenticationError(PokeForgeError):
    """Authentication required or invalid (401)."""

    def __init__(
        self, message: str, problem_details: Optional[ProblemDetails] = None
    ) -> None:
        super().__init__(message, 401, problem_details)


class ForbiddenError(PokeForgeError):
    """Access denied (403)."""

    def __init__(
        self, message: str, problem_details: Optional[ProblemDetails] = None
    ) -> None:
        super().__init__(message, 403, problem_details)


class RateLimitError(PokeForgeError):
    """Rate limit exceeded (429)."""

    def __init__(
        self,
        message: str,
        problem_details: Optional[ProblemDetails] = None,
        retry_after: Optional[int] = None,
    ) -> None:
        super().__init__(message, 429, problem_details)
        self.retry_after = retry_after


class ValidationError(PokeForgeError):
    """Request validation failed (400)."""

    def __init__(
        self, message: str, problem_details: Optional[ProblemDetails] = None
    ) -> None:
        super().__init__(message, 400, problem_details)
        self.errors: Optional[dict[str, list[str]]] = None
        if problem_details and problem_details.errors:
            self.errors = problem_details.errors


class TimeoutError(PokeForgeError):
    """Request timed out."""

    def __init__(self, message: str = "Request timed out") -> None:
        super().__init__(message, 0)


class NetworkError(PokeForgeError):
    """Network connectivity error."""

    def __init__(
        self, message: str = "Network error", cause: Optional[Exception] = None
    ) -> None:
        super().__init__(message, 0)
        self.__cause__ = cause
