/**
 * Parcourt toutes les pages d'une API paginée (DRF : count, next, results).
 *
 * @param {(page: number, pageSize: number) => Promise<unknown>} fetchPage
 * @param {{ pageSize?: number, maxPages?: number, extractList?: (data: unknown) => unknown[] }} options
 */
export async function fetchAllPaginatedPages(
  fetchPage,
  {
    pageSize = 100,
    maxPages = 200,
    extractList = (data) =>
      Array.isArray(data) ? data : (data?.results ?? []),
  } = {},
) {
  let merged = [];
  let pageNum = 1;
  let apiTotal = 0;

  for (;;) {
    const data = await fetchPage(pageNum, pageSize);
    const list = extractList(data);
    if (pageNum === 1) {
      apiTotal =
        typeof data?.count === "number" ? data.count : list.length;
    }
    merged = merged.concat(list);
    if (!data?.next || list.length === 0 || pageNum >= maxPages) break;
    pageNum += 1;
  }

  return { items: merged, totalCount: apiTotal || merged.length };
}
