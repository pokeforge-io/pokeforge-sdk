import { describe, it, expect, vi } from "vitest";
import { createPage, type Page, type PageFetcher } from "../Page";

describe("createPage", () => {
  const mockItems = [{ id: 1 }, { id: 2 }, { id: 3 }];

  const createMockFetcher = (pages: { data: { id: number }[]; hasNext: boolean; hasPrevious: boolean }[]): PageFetcher<{ id: number }> => {
    return vi.fn(async (options) => {
      const pageIndex = (options.page ?? 1) - 1;
      const pageData = pages[pageIndex];
      return createPage(
        pageData.data,
        {
          page: options.page ?? 1,
          pageSize: options.pageSize ?? 3,
          totalCount: pages.reduce((sum, p) => sum + p.data.length, 0),
          totalPages: pages.length,
          hasNext: pageData.hasNext,
          hasPrevious: pageData.hasPrevious,
        },
        createMockFetcher(pages)
      );
    });
  };

  describe("pagination metadata", () => {
    it("should create page with pagination info", () => {
      const fetcher = vi.fn();
      const page = createPage(mockItems, {
        page: 1,
        pageSize: 3,
        totalCount: 10,
        totalPages: 4,
        hasNext: true,
        hasPrevious: false,
      }, fetcher);

      expect(page.data).toEqual(mockItems);
      expect(page.pagination).toEqual({
        page: 1,
        pageSize: 3,
        totalCount: 10,
        totalPages: 4,
        hasNext: true,
        hasPrevious: false,
      });
    });

    it("should use defaults when pagination info is undefined", () => {
      const fetcher = vi.fn();
      const page = createPage(mockItems, undefined, fetcher);

      expect(page.pagination).toEqual({
        page: 1,
        pageSize: 3,
        totalCount: 3,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      });
    });
  });

  describe("nextPage", () => {
    it("should return next page when hasNext is true", async () => {
      const pages = [
        { data: [{ id: 1 }], hasNext: true, hasPrevious: false },
        { data: [{ id: 2 }], hasNext: false, hasPrevious: true },
      ];
      const fetcher = createMockFetcher(pages);

      const page1 = createPage(pages[0].data, {
        page: 1,
        pageSize: 1,
        totalCount: 2,
        totalPages: 2,
        hasNext: true,
        hasPrevious: false,
      }, fetcher);

      const page2 = await page1.nextPage();

      expect(page2).not.toBeNull();
      expect(page2?.data).toEqual([{ id: 2 }]);
      expect(page2?.pagination.page).toBe(2);
      expect(fetcher).toHaveBeenCalledWith({ page: 2, pageSize: 1 });
    });

    it("should return null when hasNext is false", async () => {
      const fetcher = vi.fn();
      const page = createPage(mockItems, {
        page: 1,
        pageSize: 3,
        totalCount: 3,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      }, fetcher);

      const nextPage = await page.nextPage();

      expect(nextPage).toBeNull();
      expect(fetcher).not.toHaveBeenCalled();
    });
  });

  describe("previousPage", () => {
    it("should return previous page when hasPrevious is true", async () => {
      const pages = [
        { data: [{ id: 1 }], hasNext: true, hasPrevious: false },
        { data: [{ id: 2 }], hasNext: false, hasPrevious: true },
      ];
      const fetcher = createMockFetcher(pages);

      const page2 = createPage(pages[1].data, {
        page: 2,
        pageSize: 1,
        totalCount: 2,
        totalPages: 2,
        hasNext: false,
        hasPrevious: true,
      }, fetcher);

      const page1 = await page2.previousPage();

      expect(page1).not.toBeNull();
      expect(page1?.data).toEqual([{ id: 1 }]);
      expect(page1?.pagination.page).toBe(1);
      expect(fetcher).toHaveBeenCalledWith({ page: 1, pageSize: 1 });
    });

    it("should return null when hasPrevious is false", async () => {
      const fetcher = vi.fn();
      const page = createPage(mockItems, {
        page: 1,
        pageSize: 3,
        totalCount: 3,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      }, fetcher);

      const prevPage = await page.previousPage();

      expect(prevPage).toBeNull();
      expect(fetcher).not.toHaveBeenCalled();
    });
  });

  describe("goToPage", () => {
    it("should fetch specific page", async () => {
      const pages = [
        { data: [{ id: 1 }], hasNext: true, hasPrevious: false },
        { data: [{ id: 2 }], hasNext: true, hasPrevious: true },
        { data: [{ id: 3 }], hasNext: false, hasPrevious: true },
      ];
      const fetcher = createMockFetcher(pages);

      const page1 = createPage(pages[0].data, {
        page: 1,
        pageSize: 1,
        totalCount: 3,
        totalPages: 3,
        hasNext: true,
        hasPrevious: false,
      }, fetcher);

      const page3 = await page1.goToPage(3);

      expect(page3.data).toEqual([{ id: 3 }]);
      expect(page3.pagination.page).toBe(3);
      expect(fetcher).toHaveBeenCalledWith({ page: 3, pageSize: 1 });
    });
  });

  describe("toArray", () => {
    it("should collect all items from all pages", async () => {
      const pages = [
        { data: [{ id: 1 }, { id: 2 }], hasNext: true, hasPrevious: false },
        { data: [{ id: 3 }, { id: 4 }], hasNext: true, hasPrevious: true },
        { data: [{ id: 5 }], hasNext: false, hasPrevious: true },
      ];
      const fetcher = createMockFetcher(pages);

      const page1 = createPage(pages[0].data, {
        page: 1,
        pageSize: 2,
        totalCount: 5,
        totalPages: 3,
        hasNext: true,
        hasPrevious: false,
      }, fetcher);

      const allItems = await page1.toArray();

      expect(allItems).toEqual([
        { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }
      ]);
    });

    it("should return current page items when only one page", async () => {
      const fetcher = vi.fn();
      const page = createPage(mockItems, {
        page: 1,
        pageSize: 3,
        totalCount: 3,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      }, fetcher);

      const allItems = await page.toArray();

      expect(allItems).toEqual(mockItems);
      expect(fetcher).not.toHaveBeenCalled();
    });

    it("should handle empty page", async () => {
      const fetcher = vi.fn();
      const page = createPage([], {
        page: 1,
        pageSize: 10,
        totalCount: 0,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false,
      }, fetcher);

      const allItems = await page.toArray();

      expect(allItems).toEqual([]);
    });
  });

  describe("AsyncIterator", () => {
    it("should iterate through all items across pages", async () => {
      const pages = [
        { data: [{ id: 1 }, { id: 2 }], hasNext: true, hasPrevious: false },
        { data: [{ id: 3 }, { id: 4 }], hasNext: true, hasPrevious: true },
        { data: [{ id: 5 }], hasNext: false, hasPrevious: true },
      ];
      const fetcher = createMockFetcher(pages);

      const page1 = createPage(pages[0].data, {
        page: 1,
        pageSize: 2,
        totalCount: 5,
        totalPages: 3,
        hasNext: true,
        hasPrevious: false,
      }, fetcher);

      const collected: { id: number }[] = [];
      for await (const item of page1) {
        collected.push(item);
      }

      expect(collected).toEqual([
        { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }
      ]);
    });

    it("should work with single page", async () => {
      const fetcher = vi.fn();
      const page = createPage(mockItems, {
        page: 1,
        pageSize: 3,
        totalCount: 3,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      }, fetcher);

      const collected: { id: number }[] = [];
      for await (const item of page) {
        collected.push(item);
      }

      expect(collected).toEqual(mockItems);
      expect(fetcher).not.toHaveBeenCalled();
    });

    it("should handle empty page", async () => {
      const fetcher = vi.fn();
      const page = createPage([], undefined, fetcher);

      const collected: unknown[] = [];
      for await (const item of page) {
        collected.push(item);
      }

      expect(collected).toEqual([]);
    });
  });
});
