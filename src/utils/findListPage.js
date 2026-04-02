import { dashboardAPI } from "../api/dashboard.api";
import { clientsAPI } from "../api/client.api";
import { ORDERING_NEWEST_FIRST } from "../constants/listOrdering";
import { ORDERS_LIST_PAGE_SIZE } from "../hooks/useOrders";
import {
  CLIENTS_LIST_PAGE_SIZE,
  extractClientsRows,
} from "../hooks/useClients";

/**
 * Trouve la page (1-based) où se trouve la commande, même ordering que la liste admin.
 * @returns {Promise<number | null>}
 */
export async function findOrderListPage(orderId, pageSize = ORDERS_LIST_PAGE_SIZE) {
  const id = String(orderId ?? "");
  if (!id) return null;

  let page = 1;
  const maxPages = 500;
  for (;;) {
    const { data } = await dashboardAPI.listOrders({
      page,
      page_size: pageSize,
      ordering: ORDERING_NEWEST_FIRST,
    });
    const list = Array.isArray(data) ? data : (data.results ?? []);
    if (list.some((o) => String(o.id) === id)) return page;

    const count = typeof data.count === "number" ? data.count : 0;
    const totalPages =
      data.total_pages ?? Math.max(1, Math.ceil(count / pageSize));
    if (page >= totalPages || list.length === 0 || page >= maxPages)
      return null;
    page += 1;
  }
}

/**
 * Trouve la page (1-based) où se trouve le client.
 * @returns {Promise<number | null>}
 */
export async function findClientListPage(clientId, pageSize = CLIENTS_LIST_PAGE_SIZE) {
  const id = String(clientId ?? "");
  if (!id) return null;

  let page = 1;
  const maxPages = 500;
  for (;;) {
    const { data } = await clientsAPI.list({
      page,
      page_size: pageSize,
      ordering: ORDERING_NEWEST_FIRST,
    });
    const rows = extractClientsRows(data);
    if (rows.some((c) => String(c.id) === id)) return page;

    const count = typeof data?.count === "number" ? data.count : rows.length;
    const totalPages = Math.max(
      1,
      data?.total_pages ?? Math.ceil(count / pageSize),
    );
    if (page >= totalPages || rows.length === 0 || page >= maxPages)
      return null;
    page += 1;
  }
}
