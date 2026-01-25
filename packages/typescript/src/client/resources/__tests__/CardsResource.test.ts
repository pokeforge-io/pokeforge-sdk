import { describe, it, expect, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { HttpClient } from "../../http/HttpClient";
import { CardsResource } from "../CardsResource";
import { server } from "../../../__tests__/mocks/server";

const BASE_URL = "https://api.pokeforge.gg";

describe("CardsResource", () => {
  let httpClient: HttpClient;
  let cards: CardsResource;

  beforeEach(() => {
    httpClient = new HttpClient({ baseUrl: BASE_URL });
    cards = new CardsResource(httpClient);
  });

  describe("list", () => {
    it("should fetch cards with default options", async () => {
      server.use(
        http.get(`${BASE_URL}/Cards`, () => {
          return HttpResponse.json({
            data: [{ id: "card-1", name: "Pikachu" }],
            pagination: {
              page: 1,
              pageSize: 20,
              totalCount: 1,
              totalPages: 1,
              hasNext: false,
              hasPrevious: false,
            },
          });
        })
      );

      const page = await cards.list();

      expect(page.data).toHaveLength(1);
      expect(page.data[0].id).toBe("card-1");
      expect(page.pagination.page).toBe(1);
    });

    it("should pass query parameters", async () => {
      let capturedUrl: string | undefined;

      server.use(
        http.get(`${BASE_URL}/Cards`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json({
            data: [],
            pagination: { page: 1, pageSize: 10, totalCount: 0, totalPages: 0, hasNext: false, hasPrevious: false },
          });
        })
      );

      await cards.list({
        page: 2,
        pageSize: 10,
        setId: "set-123",
        rarity: "Rare",
        sortBy: "Name",
        sortOrder: "Desc",
      });

      const url = new URL(capturedUrl!);
      expect(url.searchParams.get("page")).toBe("2");
      expect(url.searchParams.get("pageSize")).toBe("10");
      expect(url.searchParams.get("setId")).toBe("set-123");
      expect(url.searchParams.get("rarity")).toBe("Rare");
      expect(url.searchParams.get("sortBy")).toBe("Name");
      expect(url.searchParams.get("sortOrder")).toBe("Desc");
    });

    it("should support pagination navigation", async () => {
      server.use(
        http.get(`${BASE_URL}/Cards`, ({ request }) => {
          const url = new URL(request.url);
          const page = parseInt(url.searchParams.get("page") ?? "1");
          return HttpResponse.json({
            data: [{ id: `card-page-${page}`, name: `Card ${page}` }],
            pagination: {
              page,
              pageSize: 1,
              totalCount: 3,
              totalPages: 3,
              hasNext: page < 3,
              hasPrevious: page > 1,
            },
          });
        })
      );

      const page1 = await cards.list({ pageSize: 1 });
      expect(page1.data[0].id).toBe("card-page-1");
      expect(page1.pagination.hasNext).toBe(true);

      const page2 = await page1.nextPage();
      expect(page2?.data[0].id).toBe("card-page-2");
    });
  });

  describe("get", () => {
    it("should fetch single card by ID", async () => {
      server.use(
        http.get(`${BASE_URL}/Cards/card-123`, () => {
          return HttpResponse.json({
            data: { id: "card-123", name: "Pikachu", hp: 60 },
          });
        })
      );

      const card = await cards.get("card-123");

      expect(card.id).toBe("card-123");
      expect(card.name).toBe("Pikachu");
    });

    it("should throw when card data is missing", async () => {
      server.use(
        http.get(`${BASE_URL}/Cards/card-missing`, () => {
          return HttpResponse.json({ data: null });
        })
      );

      await expect(cards.get("card-missing")).rejects.toThrow("Card not found");
    });
  });

  describe("search", () => {
    it("should search cards by query", async () => {
      let capturedUrl: string | undefined;

      server.use(
        http.get(`${BASE_URL}/Cards/search`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json({
            data: [{ id: "card-1", name: "Pikachu" }],
            pagination: { page: 1, pageSize: 20, totalCount: 1, totalPages: 1, hasNext: false, hasPrevious: false },
          });
        })
      );

      const page = await cards.search({ q: "Pikachu" });

      expect(page.data).toHaveLength(1);
      const url = new URL(capturedUrl!);
      expect(url.searchParams.get("q")).toBe("Pikachu");
    });

    it("should pass optional setId filter", async () => {
      let capturedUrl: string | undefined;

      server.use(
        http.get(`${BASE_URL}/Cards/search`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json({
            data: [],
            pagination: { page: 1, pageSize: 20, totalCount: 0, totalPages: 0, hasNext: false, hasPrevious: false },
          });
        })
      );

      await cards.search({ q: "Pikachu", setId: "set-123" });

      const url = new URL(capturedUrl!);
      expect(url.searchParams.get("setId")).toBe("set-123");
    });
  });

  describe("getVariants", () => {
    it("should fetch card variants", async () => {
      server.use(
        http.get(`${BASE_URL}/Cards/card-123/variants`, () => {
          return HttpResponse.json({
            variants: [
              { id: "v1", type: "Normal" },
              { id: "v2", type: "Reverse Holo" },
            ],
          });
        })
      );

      const variants = await cards.getVariants("card-123");

      expect(variants).toHaveLength(2);
      expect(variants[0].type).toBe("Normal");
    });

    it("should return empty array when no variants", async () => {
      server.use(
        http.get(`${BASE_URL}/Cards/card-123/variants`, () => {
          return HttpResponse.json({ variants: null });
        })
      );

      const variants = await cards.getVariants("card-123");

      expect(variants).toEqual([]);
    });
  });

  describe("getFilters", () => {
    it("should fetch available filters", async () => {
      server.use(
        http.get(`${BASE_URL}/Cards/filters`, () => {
          return HttpResponse.json({
            data: {
              rarities: ["Common", "Rare"],
              types: ["Fire", "Water"],
            },
          });
        })
      );

      const filters = await cards.getFilters();

      expect(filters.rarities).toContain("Common");
      expect(filters.types).toContain("Fire");
    });

    it("should throw when filters data is missing", async () => {
      server.use(
        http.get(`${BASE_URL}/Cards/filters`, () => {
          return HttpResponse.json({ data: null });
        })
      );

      await expect(cards.getFilters()).rejects.toThrow("Failed to fetch card filters");
    });
  });

  describe("recordView", () => {
    it("should post view event", async () => {
      let called = false;

      server.use(
        http.post(`${BASE_URL}/Cards/card-123/views`, () => {
          called = true;
          return new HttpResponse(null, { status: 204 });
        })
      );

      await cards.recordView("card-123");

      expect(called).toBe(true);
    });
  });

  describe("listAll", () => {
    it("should iterate through all cards", async () => {
      server.use(
        http.get(`${BASE_URL}/Cards`, ({ request }) => {
          const url = new URL(request.url);
          const page = parseInt(url.searchParams.get("page") ?? "1");
          return HttpResponse.json({
            data: [{ id: `card-${page}`, name: `Card ${page}` }],
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
      for await (const card of cards.listAll()) {
        collected.push(card);
      }

      expect(collected).toHaveLength(2);
    });
  });
});
