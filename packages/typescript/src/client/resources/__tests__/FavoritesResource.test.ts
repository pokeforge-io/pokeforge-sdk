import { describe, it, expect, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { HttpClient } from "../../http/HttpClient";
import { FavoritesResource } from "../FavoritesResource";
import { server } from "../../../__tests__/mocks/server";

const BASE_URL = "https://api.pokeforge.gg";

describe("FavoritesResource", () => {
  let httpClient: HttpClient;
  let favorites: FavoritesResource;

  beforeEach(() => {
    httpClient = new HttpClient({
      baseUrl: BASE_URL,
      auth: { type: "static", token: "test-token" },
    });
    favorites = new FavoritesResource(httpClient);
  });

  describe("list", () => {
    it("should fetch favorites with pagination", async () => {
      server.use(
        http.get(`${BASE_URL}/Favorites`, () => {
          return HttpResponse.json({
            data: [
              { cardId: "card-1", cardName: "Pikachu", favoritedAt: "2024-01-01T00:00:00Z" },
            ],
            pagination: { page: 1, pageSize: 20, totalCount: 1, totalPages: 1, hasNext: false, hasPrevious: false },
          });
        })
      );

      const page = await favorites.list();

      expect(page.data).toHaveLength(1);
      expect(page.data[0].cardName).toBe("Pikachu");
    });

    it("should pass pagination options", async () => {
      let capturedUrl: string | undefined;

      server.use(
        http.get(`${BASE_URL}/Favorites`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json({
            data: [],
            pagination: { page: 2, pageSize: 10, totalCount: 0, totalPages: 0, hasNext: false, hasPrevious: true },
          });
        })
      );

      await favorites.list({ page: 2, pageSize: 10 });

      const url = new URL(capturedUrl!);
      expect(url.searchParams.get("page")).toBe("2");
      expect(url.searchParams.get("pageSize")).toBe("10");
    });
  });

  describe("add", () => {
    it("should add card to favorites", async () => {
      server.use(
        http.post(`${BASE_URL}/Favorites/card-123`, () => {
          return HttpResponse.json({
            data: { cardId: "card-123", cardName: "Pikachu", favoritedAt: "2024-01-01T00:00:00Z" },
            wasAlreadyFavorited: false,
          });
        })
      );

      const result = await favorites.add("card-123");

      expect(result.card.cardId).toBe("card-123");
      expect(result.wasAlreadyFavorited).toBe(false);
    });

    it("should indicate when already favorited", async () => {
      server.use(
        http.post(`${BASE_URL}/Favorites/card-123`, () => {
          return HttpResponse.json({
            data: { cardId: "card-123", cardName: "Pikachu" },
            wasAlreadyFavorited: true,
          });
        })
      );

      const result = await favorites.add("card-123");

      expect(result.wasAlreadyFavorited).toBe(true);
    });

    it("should throw when add fails", async () => {
      server.use(
        http.post(`${BASE_URL}/Favorites/card-123`, () => {
          return HttpResponse.json({ data: null });
        })
      );

      await expect(favorites.add("card-123")).rejects.toThrow("Failed to add favorite");
    });
  });

  describe("remove", () => {
    it("should remove card from favorites", async () => {
      let removed = false;

      server.use(
        http.delete(`${BASE_URL}/Favorites/card-123`, () => {
          removed = true;
          return new HttpResponse(null, { status: 204 });
        })
      );

      await favorites.remove("card-123");

      expect(removed).toBe(true);
    });
  });

  describe("check", () => {
    it("should check favorite status for multiple cards", async () => {
      server.use(
        http.get(`${BASE_URL}/Favorites/check`, ({ request }) => {
          const url = new URL(request.url);
          const cardIds = url.searchParams.get("cardIds")?.split(",") ?? [];
          const result: Record<string, boolean> = {};
          for (const id of cardIds) {
            result[id] = id === "card-1";
          }
          return HttpResponse.json({ data: result });
        })
      );

      const status = await favorites.check(["card-1", "card-2", "card-3"]);

      expect(status["card-1"]).toBe(true);
      expect(status["card-2"]).toBe(false);
      expect(status["card-3"]).toBe(false);
    });

    it("should return empty object when no data", async () => {
      server.use(
        http.get(`${BASE_URL}/Favorites/check`, () => {
          return HttpResponse.json({ data: null });
        })
      );

      const status = await favorites.check([]);

      expect(status).toEqual({});
    });
  });

  describe("toggle", () => {
    it("should add when not favorited", async () => {
      server.use(
        http.get(`${BASE_URL}/Favorites/check`, () => {
          return HttpResponse.json({ data: { "card-123": false } });
        }),
        http.post(`${BASE_URL}/Favorites/card-123`, () => {
          return HttpResponse.json({
            data: { cardId: "card-123", cardName: "Pikachu" },
          });
        })
      );

      const result = await favorites.toggle("card-123");

      expect(result).toBe(true);
    });

    it("should remove when already favorited", async () => {
      server.use(
        http.get(`${BASE_URL}/Favorites/check`, () => {
          return HttpResponse.json({ data: { "card-123": true } });
        }),
        http.delete(`${BASE_URL}/Favorites/card-123`, () => {
          return new HttpResponse(null, { status: 204 });
        })
      );

      const result = await favorites.toggle("card-123");

      expect(result).toBe(false);
    });
  });

  describe("listAll", () => {
    it("should iterate through all favorites", async () => {
      server.use(
        http.get(`${BASE_URL}/Favorites`, ({ request }) => {
          const url = new URL(request.url);
          const page = parseInt(url.searchParams.get("page") ?? "1");
          return HttpResponse.json({
            data: [{ cardId: `card-${page}`, cardName: `Card ${page}` }],
            pagination: {
              page,
              pageSize: 1,
              totalCount: 2,
              totalPages: 2,
              hasNext: page < 2,
              hasPrevious: page > 1,
            },
          });
        })
      );

      const collected: unknown[] = [];
      for await (const fav of favorites.listAll()) {
        collected.push(fav);
      }

      expect(collected).toHaveLength(2);
    });
  });
});
