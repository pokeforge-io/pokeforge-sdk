import { describe, it, expect } from "vitest";
import {
  PokeForgeError,
  NotFoundError,
  AuthenticationError,
  ForbiddenError,
  ValidationError,
  RateLimitError,
  TimeoutError,
  NetworkError,
} from "../errors";

describe("PokeForgeError", () => {
  describe("constructor", () => {
    it("should create error with message and status", () => {
      const error = new PokeForgeError("Test error", 500);

      expect(error.message).toBe("Test error");
      expect(error.status).toBe(500);
      expect(error.name).toBe("PokeForgeError");
    });

    it("should include problem details", () => {
      const pd = {
        title: "Error",
        detail: "Detailed error message",
        type: "https://example.com/error",
        instance: "/api/test",
      };
      const error = new PokeForgeError("Error", 500, pd);

      expect(error.type).toBe("https://example.com/error");
      expect(error.detail).toBe("Detailed error message");
      expect(error.instance).toBe("/api/test");
      expect(error.raw).toBe(pd);
    });

    it("should handle missing problem details fields", () => {
      const error = new PokeForgeError("Error", 500, {});

      expect(error.type).toBeUndefined();
      expect(error.detail).toBeUndefined();
      expect(error.instance).toBeUndefined();
    });
  });

  describe("fromResponse", () => {
    it("should create ValidationError for 400", () => {
      const error = PokeForgeError.fromResponse(400, { title: "Bad Request" });

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.status).toBe(400);
      expect(error.name).toBe("ValidationError");
    });

    it("should create AuthenticationError for 401", () => {
      const error = PokeForgeError.fromResponse(401, { title: "Unauthorized" });

      expect(error).toBeInstanceOf(AuthenticationError);
      expect(error.status).toBe(401);
      expect(error.name).toBe("AuthenticationError");
    });

    it("should create ForbiddenError for 403", () => {
      const error = PokeForgeError.fromResponse(403, { title: "Forbidden" });

      expect(error).toBeInstanceOf(ForbiddenError);
      expect(error.status).toBe(403);
      expect(error.name).toBe("ForbiddenError");
    });

    it("should create NotFoundError for 404", () => {
      const error = PokeForgeError.fromResponse(404, { title: "Not Found" });

      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.status).toBe(404);
      expect(error.name).toBe("NotFoundError");
    });

    it("should create RateLimitError for 429", () => {
      const error = PokeForgeError.fromResponse(429, { title: "Rate Limited" });

      expect(error).toBeInstanceOf(RateLimitError);
      expect(error.status).toBe(429);
      expect(error.name).toBe("RateLimitError");
    });

    it("should create PokeForgeError for other status codes", () => {
      const error = PokeForgeError.fromResponse(500, { title: "Server Error" });

      expect(error).toBeInstanceOf(PokeForgeError);
      expect(error.constructor).toBe(PokeForgeError);
      expect(error.status).toBe(500);
    });

    it("should use title as message", () => {
      const error = PokeForgeError.fromResponse(500, { title: "My Title" });

      expect(error.message).toBe("My Title");
    });

    it("should use detail as message if no title", () => {
      const error = PokeForgeError.fromResponse(500, { detail: "My Detail" });

      expect(error.message).toBe("My Detail");
    });

    it("should use default message if no title or detail", () => {
      const error = PokeForgeError.fromResponse(500, {});

      expect(error.message).toBe("HTTP 500 error");
    });

    it("should handle undefined body", () => {
      const error = PokeForgeError.fromResponse(500);

      expect(error.message).toBe("HTTP 500 error");
    });
  });
});

describe("NotFoundError", () => {
  it("should have correct status and name", () => {
    const error = new NotFoundError("Resource not found");

    expect(error.status).toBe(404);
    expect(error.name).toBe("NotFoundError");
    expect(error).toBeInstanceOf(PokeForgeError);
  });
});

describe("AuthenticationError", () => {
  it("should have correct status and name", () => {
    const error = new AuthenticationError("Invalid token");

    expect(error.status).toBe(401);
    expect(error.name).toBe("AuthenticationError");
    expect(error).toBeInstanceOf(PokeForgeError);
  });
});

describe("ForbiddenError", () => {
  it("should have correct status and name", () => {
    const error = new ForbiddenError("Access denied");

    expect(error.status).toBe(403);
    expect(error.name).toBe("ForbiddenError");
    expect(error).toBeInstanceOf(PokeForgeError);
  });
});

describe("ValidationError", () => {
  it("should have correct status and name", () => {
    const error = new ValidationError("Validation failed");

    expect(error.status).toBe(400);
    expect(error.name).toBe("ValidationError");
    expect(error).toBeInstanceOf(PokeForgeError);
  });

  it("should extract field errors from problem details", () => {
    const pd = {
      title: "Validation Failed",
      errors: {
        name: ["required", "too short"],
        email: ["invalid format"],
      },
    };
    const error = new ValidationError("Validation failed", pd);

    expect(error.errors).toEqual({
      name: ["required", "too short"],
      email: ["invalid format"],
    });
  });

  it("should have undefined errors if not in problem details", () => {
    const error = new ValidationError("Validation failed", { title: "Error" });

    expect(error.errors).toBeUndefined();
  });
});

describe("RateLimitError", () => {
  it("should have correct status and name", () => {
    const error = new RateLimitError("Rate limited");

    expect(error.status).toBe(429);
    expect(error.name).toBe("RateLimitError");
    expect(error).toBeInstanceOf(PokeForgeError);
  });

  it("should include retryAfter", () => {
    const error = new RateLimitError("Rate limited", undefined, 60000);

    expect(error.retryAfter).toBe(60000);
  });

  it("should have undefined retryAfter if not provided", () => {
    const error = new RateLimitError("Rate limited");

    expect(error.retryAfter).toBeUndefined();
  });
});

describe("TimeoutError", () => {
  it("should have correct status and name", () => {
    const error = new TimeoutError("Request timed out");

    expect(error.status).toBe(0);
    expect(error.name).toBe("TimeoutError");
    expect(error).toBeInstanceOf(PokeForgeError);
  });

  it("should use default message", () => {
    const error = new TimeoutError();

    expect(error.message).toBe("Request timed out");
  });
});

describe("NetworkError", () => {
  it("should have correct status and name", () => {
    const error = new NetworkError("Connection failed");

    expect(error.status).toBe(0);
    expect(error.name).toBe("NetworkError");
    expect(error).toBeInstanceOf(PokeForgeError);
  });

  it("should use default message", () => {
    const error = new NetworkError();

    expect(error.message).toBe("Network error");
  });

  it("should include cause", () => {
    const cause = new Error("Original error");
    const error = new NetworkError("Network error", cause);

    expect(error.cause).toBe(cause);
  });
});
