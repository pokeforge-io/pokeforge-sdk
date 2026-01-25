import { describe, it, expect, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { HttpClient } from "../../http/HttpClient";
import { CollectionsResource } from "../CollectionsResource";
import { server } from "../../../__tests__/mocks/server";

const BASE_URL = "https://api.pokeforge.gg";

describe("CollectionsResource", () => {
  let httpClient: HttpClient;
  let collections: CollectionsResource;

  beforeEach(() => {
    httpClient = new HttpClient({
      baseUrl: BASE_URL,
      auth: { type: "static", token: "test-token" },
    });
    collections = new CollectionsResource(httpClient);
  });

  describe("list", () => {
    it("should fetch all collections", async () => {
      server.use(
        http.get(`${BASE_URL}/Collections`, () => {
          return HttpResponse.json({
            data: [
              { id: "col-1", name: "My Collection" },
              { id: "col-2", name: "Trade Binder" },
            ],
          });
        })
      );

      const result = await collections.list();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("My Collection");
    });

    it("should return empty array when no data", async () => {
      server.use(
        http.get(`${BASE_URL}/Collections`, () => {
          return HttpResponse.json({ data: null });
        })
      );

      const result = await collections.list();

      expect(result).toEqual([]);
    });
  });

  describe("get", () => {
    it("should fetch single collection", async () => {
      server.use(
        http.get(`${BASE_URL}/Collections/col-123`, () => {
          return HttpResponse.json({
            data: { id: "col-123", name: "My Collection", cardCount: 50 },
          });
        })
      );

      const collection = await collections.get("col-123");

      expect(collection.id).toBe("col-123");
      expect(collection.cardCount).toBe(50);
    });

    it("should throw when collection not found", async () => {
      server.use(
        http.get(`${BASE_URL}/Collections/not-found`, () => {
          return HttpResponse.json({ data: null });
        })
      );

      await expect(collections.get("not-found")).rejects.toThrow("Collection not found");
    });
  });

  describe("create", () => {
    it("should create collection", async () => {
      server.use(
        http.post(`${BASE_URL}/Collections`, async ({ request }) => {
          const body = await request.json() as { name: string };
          return HttpResponse.json({
            data: { id: "col-new", name: body.name, cardCount: 0 },
          });
        })
      );

      const collection = await collections.create({ name: "New Collection" });

      expect(collection.id).toBe("col-new");
      expect(collection.name).toBe("New Collection");
    });

    it("should pass type and visibility options", async () => {
      let capturedBody: unknown;

      server.use(
        http.post(`${BASE_URL}/Collections`, async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json({
            data: { id: "col-new", name: "Test" },
          });
        })
      );

      await collections.create({
        name: "Test",
        type: "Personal",
        visibility: "Private",
      });

      expect(capturedBody).toEqual({
        name: "Test",
        type: "Personal",
        visibility: "Private",
      });
    });

    it("should throw when creation fails", async () => {
      server.use(
        http.post(`${BASE_URL}/Collections`, () => {
          return HttpResponse.json({ data: null });
        })
      );

      await expect(collections.create({ name: "Test" })).rejects.toThrow("Failed to create collection");
    });
  });

  describe("update", () => {
    it("should update collection", async () => {
      server.use(
        http.put(`${BASE_URL}/Collections/col-123`, async ({ request }) => {
          const body = await request.json() as { name?: string };
          return HttpResponse.json({
            data: { id: "col-123", name: body.name ?? "Old Name" },
          });
        })
      );

      const collection = await collections.update("col-123", { name: "Updated Name" });

      expect(collection.name).toBe("Updated Name");
    });

    it("should throw when update fails", async () => {
      server.use(
        http.put(`${BASE_URL}/Collections/col-123`, () => {
          return HttpResponse.json({ data: null });
        })
      );

      await expect(collections.update("col-123", { name: "Test" })).rejects.toThrow("Failed to update collection");
    });
  });

  describe("delete", () => {
    it("should delete collection", async () => {
      let deleted = false;

      server.use(
        http.delete(`${BASE_URL}/Collections/col-123`, () => {
          deleted = true;
          return new HttpResponse(null, { status: 204 });
        })
      );

      await collections.delete("col-123");

      expect(deleted).toBe(true);
    });
  });

  describe("getItems", () => {
    it("should fetch collection items with pagination", async () => {
      server.use(
        http.get(`${BASE_URL}/Collections/col-123/items`, () => {
          return HttpResponse.json({
            data: [{ id: "item-1", cardId: "card-1", quantity: 2 }],
            pagination: { page: 1, pageSize: 20, totalCount: 1, totalPages: 1, hasNext: false, hasPrevious: false },
          });
        })
      );

      const page = await collections.getItems("col-123");

      expect(page.data).toHaveLength(1);
      expect(page.data[0].quantity).toBe(2);
    });

    it("should pass query options", async () => {
      let capturedUrl: string | undefined;

      server.use(
        http.get(`${BASE_URL}/Collections/col-123/items`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json({
            data: [],
            pagination: { page: 1, pageSize: 10, totalCount: 0, totalPages: 0, hasNext: false, hasPrevious: false },
          });
        })
      );

      await collections.getItems("col-123", { page: 2, pageSize: 10, search: "Pikachu" });

      const url = new URL(capturedUrl!);
      expect(url.searchParams.get("page")).toBe("2");
      expect(url.searchParams.get("pageSize")).toBe("10");
      expect(url.searchParams.get("search")).toBe("Pikachu");
    });
  });

  describe("addItem", () => {
    it("should add item to collection", async () => {
      server.use(
        http.post(`${BASE_URL}/Collections/col-123/items`, async ({ request }) => {
          const body = await request.json() as { cardId: string; quantity?: number };
          return HttpResponse.json({
            data: { id: "item-new", cardId: body.cardId, quantity: body.quantity ?? 1 },
          });
        })
      );

      const item = await collections.addItem("col-123", { cardId: "card-456", quantity: 3 });

      expect(item.cardId).toBe("card-456");
      expect(item.quantity).toBe(3);
    });

    it("should throw when add fails", async () => {
      server.use(
        http.post(`${BASE_URL}/Collections/col-123/items`, () => {
          return HttpResponse.json({ data: null });
        })
      );

      await expect(collections.addItem("col-123", { cardId: "card-1" })).rejects.toThrow("Failed to add item to collection");
    });
  });

  describe("updateItem", () => {
    it("should update collection item", async () => {
      server.use(
        http.put(`${BASE_URL}/Collections/col-123/items/item-456`, async ({ request }) => {
          const body = await request.json() as { quantity?: number };
          return HttpResponse.json({
            data: { id: "item-456", cardId: "card-1", quantity: body.quantity ?? 1 },
          });
        })
      );

      const item = await collections.updateItem("col-123", "item-456", { quantity: 5 });

      expect(item.quantity).toBe(5);
    });

    it("should throw when update fails", async () => {
      server.use(
        http.put(`${BASE_URL}/Collections/col-123/items/item-456`, () => {
          return HttpResponse.json({ data: null });
        })
      );

      await expect(collections.updateItem("col-123", "item-456", { quantity: 1 })).rejects.toThrow("Failed to update collection item");
    });
  });

  describe("removeItem", () => {
    it("should remove item from collection", async () => {
      let removed = false;

      server.use(
        http.delete(`${BASE_URL}/Collections/col-123/items/item-456`, () => {
          removed = true;
          return new HttpResponse(null, { status: 204 });
        })
      );

      await collections.removeItem("col-123", "item-456");

      expect(removed).toBe(true);
    });
  });

  describe("bulkAddItems", () => {
    it("should bulk add items", async () => {
      server.use(
        http.post(`${BASE_URL}/Collections/col-123/items/bulk`, () => {
          return HttpResponse.json({
            data: { added: 3, errors: [] },
          });
        })
      );

      const result = await collections.bulkAddItems("col-123", [
        { cardId: "card-1" },
        { cardId: "card-2" },
        { cardId: "card-3" },
      ]);

      expect(result.added).toBe(3);
    });

    it("should throw when bulk add fails", async () => {
      server.use(
        http.post(`${BASE_URL}/Collections/col-123/items/bulk`, () => {
          return HttpResponse.json({ data: null });
        })
      );

      await expect(collections.bulkAddItems("col-123", [])).rejects.toThrow("Failed to bulk add items");
    });
  });
});
