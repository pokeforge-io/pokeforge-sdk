import type { components } from "../../generated/api";

type PaginationInfo = components["schemas"]["PaginationInfo"];

/** Pagination metadata */
export interface PageInfo {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/** Options for paginated list requests */
export interface PaginationOptions {
  page?: number;
  pageSize?: number;
}

/** Internal function type for fetching pages */
export type PageFetcher<T> = (options: PaginationOptions) => Promise<Page<T>>;

/** Represents a page of results with pagination metadata */
export interface Page<T> extends AsyncIterable<T> {
  /** The items in this page */
  readonly data: T[];

  /** Pagination metadata */
  readonly pagination: PageInfo;

  /** Fetch the next page (if available) */
  nextPage(): Promise<Page<T> | null>;

  /** Fetch the previous page (if available) */
  previousPage(): Promise<Page<T> | null>;

  /** Fetch a specific page */
  goToPage(page: number): Promise<Page<T>>;

  /** Convert all pages to a single array (fetches remaining pages) */
  toArray(): Promise<T[]>;
}

/** Create a Page instance from API response */
export function createPage<T>(
  data: T[],
  paginationInfo: PaginationInfo | undefined,
  fetcher: PageFetcher<T>
): Page<T> {
  const pagination: PageInfo = {
    page: paginationInfo?.page ?? 1,
    pageSize: paginationInfo?.pageSize ?? data.length,
    totalCount: paginationInfo?.totalCount ?? data.length,
    totalPages: paginationInfo?.totalPages ?? 1,
    hasNext: paginationInfo?.hasNext ?? false,
    hasPrevious: paginationInfo?.hasPrevious ?? false,
  };

  const page: Page<T> = {
    data,
    pagination,

    async nextPage() {
      if (!pagination.hasNext) return null;
      return fetcher({ page: pagination.page + 1, pageSize: pagination.pageSize });
    },

    async previousPage() {
      if (!pagination.hasPrevious) return null;
      return fetcher({ page: pagination.page - 1, pageSize: pagination.pageSize });
    },

    async goToPage(pageNum: number) {
      return fetcher({ page: pageNum, pageSize: pagination.pageSize });
    },

    async toArray() {
      const allItems = [...data];
      let currentPage: Page<T> | null = page;

      while (currentPage?.pagination.hasNext) {
        currentPage = await currentPage.nextPage();
        if (currentPage) {
          allItems.push(...currentPage.data);
        }
      }

      return allItems;
    },

    async *[Symbol.asyncIterator]() {
      // Yield items from current page
      for (const item of data) {
        yield item;
      }

      // Fetch and yield from subsequent pages
      let currentPage: Page<T> | null = page;
      while (currentPage?.pagination.hasNext) {
        currentPage = await currentPage.nextPage();
        if (currentPage) {
          for (const item of currentPage.data) {
            yield item;
          }
        }
      }
    },
  };

  return page;
}
