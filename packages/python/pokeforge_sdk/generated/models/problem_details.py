"""Problem details model for error responses."""

from typing import Optional

from pydantic import BaseModel


class ProblemDetails(BaseModel):
    """RFC 7807 Problem Details for HTTP APIs."""

    type: Optional[str] = None
    title: Optional[str] = None
    status: Optional[int] = None
    detail: Optional[str] = None
    instance: Optional[str] = None
    errors: Optional[dict[str, list[str]]] = None

    model_config = {"extra": "allow"}
