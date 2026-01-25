import { describe, it, expect, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { HttpClient } from "../../http/HttpClient";
import { SeriesResource } from "../SeriesResource";
import { server } from "../../../__tests__/mocks/server";

const BASE_URL = "https://api.pokeforge.gg";

describe("SeriesResource", () => {
  let httpClient: HttpClient;
  let series: SeriesResource;

  beforeEach(() => {
    httpClient = new HttpClient({ baseUrl: BASE_URL });
    series = new SeriesResource(httpClient);
  });

  describe("list", () => {
    it("should fetch series with pagination", async () => {
      server.use(
        http.get(`${BASE_URL}/Series`, () => {
          return HttpResponse.json({
            data: [{ id: "series-1", name: "Scarlet & Violet" }],
            pagination: { page: 1, pageSize: 20, totalCount: 1, totalPages: 1, hasNext: false, hasPrevious: false },
          });
        })
      );

      const page = await series.list();

      expect(page.data).toHaveLength(1);
      expect(page.data[0].name).toBe("Scarlet & Violet");
    });

    it("should pass filter options", async () => {
      let capturedUrl: string | undefined;

      server.use(
        http.get(`${BASE_URL}/Series`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json({
            data: [],
            pagination: { page: 1, pageSize: 20, totalCount: 0, totalPages: 0, hasNext: false, hasPrevious: false },
          });
        })
      );

      await series.list({ tcgType: "Pokemon", seriesType: "Standard" });

      const url = new URL(capturedUrl!);
      expect(url.searchParams.get("tcgType")).toBe("Pokemon");
      expect(url.searchParams.get("seriesType")).toBe("Standard");
    });
  });

  describe("get", () => {
    it("should fetch single series by ID", async () => {
      server.use(
        http.get(`${BASE_URL}/Series/series-123`, () => {
          return HttpResponse.json({
            data: { id: "series-123", name: "Scarlet & Violet" },
          });
        })
      );

      const result = await series.get("series-123");

      expect(result.id).toBe("series-123");
    });

    it("should throw when series not found", async () => {
      server.use(
        http.get(`${BASE_URL}/Series/not-found`, () => {
          return HttpResponse.json({ data: null });
        })
      );

      await expect(series.get("not-found")).rejects.toThrow("Series not found");
    });
  });

  describe("getBySlug", () => {
    it("should fetch series by slug", async () => {
      server.use(
        http.get(`${BASE_URL}/Series/scarlet-violet`, () => {
          return HttpResponse.json({
            data: { id: "series-1", name: "Scarlet & Violet", slug: "scarlet-violet" },
          });
        })
      );

      const result = await series.getBySlug("scarlet-violet");

      expect(result.slug).toBe("scarlet-violet");
    });

    it("should throw when series not found", async () => {
      server.use(
        http.get(`${BASE_URL}/Series/unknown`, () => {
          return HttpResponse.json({ data: null });
        })
      );

      await expect(series.getBySlug("unknown")).rejects.toThrow("Series not found");
    });
  });

  describe("listAll", () => {
    it("should iterate through all series", async () => {
      server.use(
        http.get(`${BASE_URL}/Series`, ({ request }) => {
          const url = new URL(request.url);
          const page = parseInt(url.searchParams.get("page") ?? "1");
          return HttpResponse.json({
            data: [{ id: `series-${page}`, name: `Series ${page}` }],
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
      for await (const s of series.listAll()) {
        collected.push(s);
      }

      expect(collected).toHaveLength(2);
    });
  });
});
