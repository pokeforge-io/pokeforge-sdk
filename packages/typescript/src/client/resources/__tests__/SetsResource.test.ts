import { describe, it, expect, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { HttpClient } from "../../http/HttpClient";
import { SetsResource } from "../SetsResource";
import { server } from "../../../__tests__/mocks/server";

const BASE_URL = "https://api.pokeforge.gg";

describe("SetsResource", () => {
  let httpClient: HttpClient;
  let sets: SetsResource;

  beforeEach(() => {
    httpClient = new HttpClient({ baseUrl: BASE_URL });
    sets = new SetsResource(httpClient);
  });

  describe("list", () => {
    it("should fetch sets with pagination", async () => {
      server.use(
        http.get(`${BASE_URL}/Sets`, () => {
          return HttpResponse.json({
            data: [{ id: "set-1", name: "Base Set" }],
            pagination: { page: 1, pageSize: 20, totalCount: 1, totalPages: 1, hasNext: false, hasPrevious: false },
          });
        })
      );

      const page = await sets.list();

      expect(page.data).toHaveLength(1);
      expect(page.data[0].name).toBe("Base Set");
    });

    it("should pass filter options", async () => {
      let capturedUrl: string | undefined;

      server.use(
        http.get(`${BASE_URL}/Sets`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json({
            data: [],
            pagination: { page: 1, pageSize: 20, totalCount: 0, totalPages: 0, hasNext: false, hasPrevious: false },
          });
        })
      );

      await sets.list({ seriesId: "series-1", setType: "Expansion", locale: "US" });

      const url = new URL(capturedUrl!);
      expect(url.searchParams.get("seriesId")).toBe("series-1");
      expect(url.searchParams.get("setType")).toBe("Expansion");
      expect(url.searchParams.get("locale")).toBe("US");
    });
  });

  describe("get", () => {
    it("should fetch single set by ID", async () => {
      server.use(
        http.get(`${BASE_URL}/Sets/set-123`, () => {
          return HttpResponse.json({
            data: { id: "set-123", name: "Base Set", totalCards: 102 },
          });
        })
      );

      const set = await sets.get("set-123");

      expect(set.id).toBe("set-123");
      expect(set.totalCards).toBe(102);
    });

    it("should throw when set not found", async () => {
      server.use(
        http.get(`${BASE_URL}/Sets/not-found`, () => {
          return HttpResponse.json({ data: null });
        })
      );

      await expect(sets.get("not-found")).rejects.toThrow("Set not found");
    });
  });

  describe("getBySlug", () => {
    it("should fetch set by slug", async () => {
      server.use(
        http.get(`${BASE_URL}/Sets/base-set`, () => {
          return HttpResponse.json({
            data: { id: "set-123", name: "Base Set", slug: "base-set" },
          });
        })
      );

      const set = await sets.getBySlug("base-set");

      expect(set.slug).toBe("base-set");
    });

    it("should pass disambiguation options", async () => {
      let capturedUrl: string | undefined;

      server.use(
        http.get(`${BASE_URL}/Sets/151`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json({
            data: { id: "set-1", name: "151", slug: "151" },
          });
        })
      );

      await sets.getBySlug("151", { seriesId: "sv", locale: "Japan" });

      const url = new URL(capturedUrl!);
      expect(url.searchParams.get("seriesId")).toBe("sv");
      expect(url.searchParams.get("locale")).toBe("Japan");
    });

    it("should throw when set not found", async () => {
      server.use(
        http.get(`${BASE_URL}/Sets/unknown-slug`, () => {
          return HttpResponse.json({ data: null });
        })
      );

      await expect(sets.getBySlug("unknown-slug")).rejects.toThrow("Set not found");
    });
  });

  describe("getMasterChecklist", () => {
    it("should fetch master checklist", async () => {
      server.use(
        http.get(`${BASE_URL}/Sets/set-123/checklist`, () => {
          return HttpResponse.json({
            data: {
              setId: "set-123",
              cards: [{ id: "card-1" }, { id: "card-2" }],
            },
          });
        })
      );

      const checklist = await sets.getMasterChecklist("set-123");

      expect(checklist.cards).toHaveLength(2);
    });

    it("should throw when checklist not found", async () => {
      server.use(
        http.get(`${BASE_URL}/Sets/set-123/checklist`, () => {
          return HttpResponse.json({ data: null });
        })
      );

      await expect(sets.getMasterChecklist("set-123")).rejects.toThrow("Checklist not found");
    });
  });

  describe("listAll", () => {
    it("should iterate through all sets", async () => {
      server.use(
        http.get(`${BASE_URL}/Sets`, ({ request }) => {
          const url = new URL(request.url);
          const page = parseInt(url.searchParams.get("page") ?? "1");
          return HttpResponse.json({
            data: [{ id: `set-${page}`, name: `Set ${page}` }],
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
      for await (const set of sets.listAll()) {
        collected.push(set);
      }

      expect(collected).toHaveLength(2);
    });
  });
});
