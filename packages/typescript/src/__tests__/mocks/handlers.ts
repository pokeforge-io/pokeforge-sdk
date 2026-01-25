import { http, HttpResponse } from "msw";

const BASE_URL = "https://api.pokeforge.gg";

// Sample card data for tests
export const mockCard = {
  id: "card-123",
  name: "Pikachu",
  rarity: "Rare",
  setId: "set-1",
  imageUrl: "https://example.com/pikachu.png",
};

export const mockCards = [
  mockCard,
  { id: "card-456", name: "Charizard", rarity: "Ultra Rare", setId: "set-1" },
  { id: "card-789", name: "Bulbasaur", rarity: "Common", setId: "set-2" },
];

export const mockSet = {
  id: "set-1",
  name: "Base Set",
  slug: "base-set",
  releaseDate: "1999-01-09",
  totalCards: 102,
};

export const mockSeries = {
  id: "series-1",
  name: "Original Series",
  slug: "original-series",
};

export const mockCollection = {
  id: "col-1",
  name: "My Collection",
  description: "My first collection",
  cardCount: 10,
};

export const mockPagination = {
  page: 1,
  pageSize: 20,
  totalCount: 100,
  totalPages: 5,
  hasNext: true,
  hasPrevious: false,
};

export const handlers = [
  // Health check
  http.get(`${BASE_URL}/health`, () => {
    return HttpResponse.json({ status: "healthy" });
  }),

  // Cards
  http.get(`${BASE_URL}/cards`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") ?? "1");
    return HttpResponse.json({
      data: mockCards,
      pagination: { ...mockPagination, page, hasPrevious: page > 1 },
    });
  }),

  http.get(`${BASE_URL}/cards/:id`, ({ params }) => {
    const card = mockCards.find((c) => c.id === params["id"]);
    if (!card) {
      return HttpResponse.json(
        { title: "Not Found", status: 404, detail: "Card not found" },
        { status: 404 }
      );
    }
    return HttpResponse.json(card);
  }),

  http.get(`${BASE_URL}/cards/search`, () => {
    return HttpResponse.json({
      data: mockCards,
      pagination: mockPagination,
    });
  }),

  http.get(`${BASE_URL}/cards/:id/variants`, () => {
    return HttpResponse.json({ data: [] });
  }),

  http.get(`${BASE_URL}/cards/filters`, () => {
    return HttpResponse.json({
      rarities: ["Common", "Rare", "Ultra Rare"],
      types: ["Fire", "Water", "Electric"],
    });
  }),

  http.post(`${BASE_URL}/cards/:id/view`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Sets
  http.get(`${BASE_URL}/sets`, () => {
    return HttpResponse.json({
      data: [mockSet],
      pagination: { ...mockPagination, totalCount: 1, totalPages: 1, hasNext: false },
    });
  }),

  http.get(`${BASE_URL}/sets/:id`, ({ params }) => {
    if (params["id"] === mockSet.id) {
      return HttpResponse.json(mockSet);
    }
    return HttpResponse.json(
      { title: "Not Found", status: 404 },
      { status: 404 }
    );
  }),

  http.get(`${BASE_URL}/sets/by-slug/:slug`, ({ params }) => {
    if (params["slug"] === mockSet.slug) {
      return HttpResponse.json(mockSet);
    }
    return HttpResponse.json(
      { title: "Not Found", status: 404 },
      { status: 404 }
    );
  }),

  http.get(`${BASE_URL}/sets/:id/master-checklist`, () => {
    return HttpResponse.json({ cards: mockCards });
  }),

  // Series
  http.get(`${BASE_URL}/series`, () => {
    return HttpResponse.json({
      data: [mockSeries],
      pagination: { ...mockPagination, totalCount: 1, totalPages: 1, hasNext: false },
    });
  }),

  http.get(`${BASE_URL}/series/:id`, ({ params }) => {
    if (params["id"] === mockSeries.id) {
      return HttpResponse.json(mockSeries);
    }
    return HttpResponse.json(
      { title: "Not Found", status: 404 },
      { status: 404 }
    );
  }),

  http.get(`${BASE_URL}/series/by-slug/:slug`, ({ params }) => {
    if (params["slug"] === mockSeries.slug) {
      return HttpResponse.json(mockSeries);
    }
    return HttpResponse.json(
      { title: "Not Found", status: 404 },
      { status: 404 }
    );
  }),

  // Collections
  http.get(`${BASE_URL}/collections`, () => {
    return HttpResponse.json({
      data: [mockCollection],
      pagination: { ...mockPagination, totalCount: 1, totalPages: 1, hasNext: false },
    });
  }),

  http.get(`${BASE_URL}/collections/:id`, ({ params }) => {
    if (params["id"] === mockCollection.id) {
      return HttpResponse.json(mockCollection);
    }
    return HttpResponse.json(
      { title: "Not Found", status: 404 },
      { status: 404 }
    );
  }),

  http.post(`${BASE_URL}/collections`, async ({ request }) => {
    const body = (await request.json()) as { name: string; description?: string };
    return HttpResponse.json(
      { id: "col-new", name: body.name, description: body.description, cardCount: 0 },
      { status: 201 }
    );
  }),

  http.put(`${BASE_URL}/collections/:id`, async ({ params, request }) => {
    const body = (await request.json()) as { name?: string; description?: string };
    return HttpResponse.json({
      ...mockCollection,
      id: params["id"],
      ...body,
    });
  }),

  http.delete(`${BASE_URL}/collections/:id`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${BASE_URL}/collections/:id/items`, () => {
    return HttpResponse.json({
      data: [{ id: "item-1", cardId: mockCard.id, quantity: 1 }],
      pagination: { ...mockPagination, totalCount: 1, totalPages: 1, hasNext: false },
    });
  }),

  http.post(`${BASE_URL}/collections/:id/items`, async ({ request }) => {
    const body = (await request.json()) as { cardId: string; quantity?: number };
    return HttpResponse.json(
      { id: "item-new", cardId: body.cardId, quantity: body.quantity ?? 1 },
      { status: 201 }
    );
  }),

  http.put(`${BASE_URL}/collections/:colId/items/:itemId`, async ({ params, request }) => {
    const body = (await request.json()) as { quantity?: number };
    return HttpResponse.json({
      id: params["itemId"],
      cardId: mockCard.id,
      quantity: body.quantity ?? 1,
    });
  }),

  http.delete(`${BASE_URL}/collections/:colId/items/:itemId`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.post(`${BASE_URL}/collections/:id/items/bulk`, () => {
    return HttpResponse.json({ added: 2 }, { status: 201 });
  }),

  http.post(`${BASE_URL}/collections/:id/items/bulk-delete`, () => {
    return HttpResponse.json({ removed: 2 });
  }),

  // Favorites
  http.get(`${BASE_URL}/favorites`, () => {
    return HttpResponse.json({
      data: [{ cardId: mockCard.id, favoritedAt: new Date().toISOString() }],
      pagination: { ...mockPagination, totalCount: 1, totalPages: 1, hasNext: false },
    });
  }),

  http.post(`${BASE_URL}/favorites`, async ({ request }) => {
    const body = (await request.json()) as { cardId: string };
    return HttpResponse.json(
      { cardId: body.cardId, favoritedAt: new Date().toISOString() },
      { status: 201 }
    );
  }),

  http.delete(`${BASE_URL}/favorites/:cardId`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.post(`${BASE_URL}/favorites/check`, async ({ request }) => {
    const body = (await request.json()) as { cardIds: string[] };
    const result: Record<string, boolean> = {};
    for (const id of body.cardIds) {
      result[id] = id === mockCard.id;
    }
    return HttpResponse.json(result);
  }),

  http.post(`${BASE_URL}/favorites/:cardId/toggle`, ({ params }) => {
    return HttpResponse.json({ cardId: params["cardId"], isFavorited: true });
  }),
];
