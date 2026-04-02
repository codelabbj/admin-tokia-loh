const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function pickUuid(...candidates) {
  for (const c of candidates) {
    if (c == null || c === "") continue;
    if (typeof c === "string") {
      const s = c.trim();
      if (UUID_RE.test(s)) return s;
      continue;
    }
    if (typeof c === "object" && c.id != null) {
      const s = String(c.id).trim();
      if (UUID_RE.test(s)) return s;
    }
  }
  return null;
}

function nest(o) {
  return o && typeof o === "object" && !Array.isArray(o) ? o : {};
}

/**
 * Lit les identifiants cibles depuis la charge brute API notification.
 */
export function extractNotificationTargets(raw) {
  if (!raw || typeof raw !== "object") {
    return {
      notificationTypeKey: "",
      targetOrderId: null,
      targetClientId: null,
    };
  }

  const type = raw.notification_type ?? "";
  const data = nest(raw.data);
  const meta = nest(raw.metadata);
  const payload = nest(raw.payload);

  let targetOrderId = pickUuid(
    raw.order_id,
    raw.orderId,
    data.order_id,
    meta.order_id,
    payload.order_id,
    typeof raw.order === "string" ? raw.order : null,
    raw.order?.id,
  );

  let targetClientId = pickUuid(
    raw.client_id,
    raw.clientId,
    raw.user_id,
    raw.account_id,
    data.client_id,
    meta.client_id,
    payload.client_id,
    typeof raw.client === "string" ? raw.client : null,
    raw.client?.id,
  );

  const objectId = pickUuid(raw.object_id);
  if (objectId) {
    if (
      !targetOrderId &&
      (type === "order_confirmed" ||
        type === "order_canceled" ||
        (typeof type === "string" && type.startsWith("order_")))
    ) {
      targetOrderId = objectId;
    }
    if (!targetClientId && type === "new_client") {
      targetClientId = objectId;
    }
  }

  return { notificationTypeKey: type, targetOrderId, targetClientId };
}

/**
 * Route à ouvrir : liste commandes / clients avec ancre logique, ou page notifications.
 */
export function getNotificationNavigatePath(notif) {
  const type = notif.notificationTypeKey ?? "";
  if (
    (type === "order_confirmed" || type === "order_canceled") &&
    notif.targetOrderId
  ) {
    return `/orders?highlightOrder=${encodeURIComponent(notif.targetOrderId)}`;
  }
  if (type === "new_client" && notif.targetClientId) {
    return `/clients?highlightClient=${encodeURIComponent(notif.targetClientId)}`;
  }
  return "/notifications";
}

export function notificationHasDeepLink(notif) {
  return getNotificationNavigatePath(notif) !== "/notifications";
}
