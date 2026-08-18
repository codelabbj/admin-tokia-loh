import { useNotifications } from "./NotificationsContext";

/** Conservé pour compatibilité : le suivi des nouvelles commandes vit dans NotificationsProvider. */
export function NewOrdersProvider({ children }) {
  return children;
}

export function useNewOrders() {
  const {
    incomingOrderIds,
    incomingCount,
    isIncomingOrder,
    markOrderSeen,
  } = useNotifications();

  return {
    incomingOrderIds,
    incomingCount,
    isIncomingOrder,
    markOrderSeen,
  };
}
