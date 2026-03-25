import { useState, useCallback } from "react";

/**
 * useToast
 *
 * @returns {{ toasts, showToast, removeToast }}
 *
 * showToast({ message, type, duration })
 *   - message  : string
 *   - type     : 'success' | 'error' | 'warning' | 'info'  (défaut: 'success')
 *   - duration : ms avant disparition automatique           (défaut: 3000)
 */
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ message, type = "success", duration = 3000 }) => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => removeToast(id), duration);
    },
    [removeToast],
  );

  return { toasts, showToast, removeToast };
};
