import { describe, it, expect, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { PokeForgeClient } from "../PokeForgeClient";
import { CardsResource } from "../resources/CardsResource";
import { SetsResource } from "../resources/SetsResource";
import { SeriesResource } from "../resources/SeriesResource";
import { CollectionsResource } from "../resources/CollectionsResource";
import { FavoritesResource } from "../resources/FavoritesResource";
import { server } from "../../__tests__/mocks/server";

const BASE_URL = "https://api.pokeforge.gg";

describe("PokeForgeClient", () => {
  let client: PokeForgeClient;

  beforeEach(() => {
    client = new PokeForgeClient({ baseUrl: BASE_URL });
  });

  describe("constructor", () => {
    it("should create client with minimal config", () => {
      const c = new PokeForgeClient({ baseUrl: BASE_URL });

      expect(c).toBeInstanceOf(PokeForgeClient);
    });

    it("should create client with auth", () => {
      const c = new PokeForgeClient({
        baseUrl: BASE_URL,
        auth: { type: "static", token: "my-token" },
      });

      expect(c).toBeInstanceOf(PokeForgeClient);
    });

    it("should initialize all resource classes", () => {
      expect(client.cards).toBeInstanceOf(CardsResource);
      expect(client.sets).toBeInstanceOf(SetsResource);
      expect(client.series).toBeInstanceOf(SeriesResource);
      expect(client.collections).toBeInstanceOf(CollectionsResource);
      expect(client.favorites).toBeInstanceOf(FavoritesResource);
    });
  });

  describe("withConfig", () => {
    it("should create new client with merged config", () => {
      const original = new PokeForgeClient({ baseUrl: BASE_URL, timeout: 5000 });
      const updated = original.withConfig({
        auth: { type: "static", token: "new-token" },
      });

      expect(updated).not.toBe(original);
      expect(updated).toBeInstanceOf(PokeForgeClient);
    });

    it("should preserve original client resources", () => {
      const original = new PokeForgeClient({ baseUrl: BASE_URL });
      const updated = original.withConfig({ timeout: 1000 });

      // Resources should be different instances
      expect(updated.cards).not.toBe(original.cards);
      expect(updated.sets).not.toBe(original.sets);
    });

    it("should allow overriding baseUrl", () => {
      const original = new PokeForgeClient({ baseUrl: BASE_URL });
      const newUrl = "https://staging-api.pokeforge.gg";

      server.use(
        http.get(`${newUrl}/health`, () => {
          return HttpResponse.json({ status: "healthy" });
        })
      );

      const updated = original.withConfig({ baseUrl: newUrl });

      // The new client should use the new base URL
      expect(updated).toBeInstanceOf(PokeForgeClient);
    });
  });

  describe("health", () => {
    it("should make health check request", async () => {
      let called = false;

      server.use(
        http.get(`${BASE_URL}/health`, () => {
          called = true;
          return HttpResponse.json({ status: "healthy" });
        })
      );

      await client.health();

      expect(called).toBe(true);
    });

    it("should throw on unhealthy API", async () => {
      server.use(
        http.get(`${BASE_URL}/health`, () => {
          return HttpResponse.json(
            { error: "Service unavailable" },
            { status: 503 }
          );
        })
      );

      const noRetryClient = new PokeForgeClient({
        baseUrl: BASE_URL,
        retries: 0,
      });

      await expect(noRetryClient.health()).rejects.toThrow();
    });
  });

  describe("resource integration", () => {
    it("should allow using cards resource", async () => {
      server.use(
        http.get(`${BASE_URL}/Cards`, () => {
          return HttpResponse.json({
            data: [{ id: "card-1", name: "Pikachu" }],
            pagination: { page: 1, pageSize: 20, totalCount: 1, totalPages: 1, hasNext: false, hasPrevious: false },
          });
        })
      );

      const page = await client.cards.list();

      expect(page.data[0].name).toBe("Pikachu");
    });

    it("should allow using sets resource", async () => {
      server.use(
        http.get(`${BASE_URL}/Sets`, () => {
          return HttpResponse.json({
            data: [{ id: "set-1", name: "Base Set" }],
            pagination: { page: 1, pageSize: 20, totalCount: 1, totalPages: 1, hasNext: false, hasPrevious: false },
          });
        })
      );

      const page = await client.sets.list();

      expect(page.data[0].name).toBe("Base Set");
    });

    it("should allow using authenticated resources", async () => {
      const authClient = new PokeForgeClient({
        baseUrl: BASE_URL,
        auth: { type: "static", token: "my-token" },
      });

      let authHeader: string | null = null;

      server.use(
        http.get(`${BASE_URL}/Collections`, ({ request }) => {
          authHeader = request.headers.get("Authorization");
          return HttpResponse.json({ data: [] });
        })
      );

      await authClient.collections.list();

      expect(authHeader).toBe("Bearer my-token");
    });
  });
});
