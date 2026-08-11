import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  deleteMessage,
  getMessages,
  markAllMessagesAsRead,
} from "../services/messagesApi";

const MessagesContext = createContext(null);
const RECENT_LIMIT = 100;
const NOTIFICATION_POLL_INTERVAL_MS = 60_000;

function countUnread(items) {
  return (Array.isArray(items) ? items : []).filter((item) => !item.isRead).length;
}

function markItemRead(item) {
  return {
    ...item,
    isRead: true,
    read: true,
    readStatus: "Read",
  };
}

export function MessagesProvider({ children }) {
  const [recentItems, setRecentItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const listenersRef = useRef(new Set());

  const notifyListingListeners = useCallback(() => {
    listenersRef.current.forEach((listener) => {
      try {
        listener();
      } catch {
        // ignore listener errors
      }
    });
  }, []);

  const subscribe = useCallback((listener) => {
    if (typeof listener !== "function") return () => {};
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  const refreshRecent = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setIsLoading(true);
    try {
      // Unread badge + drawer both source from GET /api/messages/list + is_read
      const list = await getMessages({ page: 1, limit: RECENT_LIMIT });
      const items = Array.isArray(list.items) ? list.items : [];
      const nextUnread = countUnread(items);

      setRecentItems(items);
      setUnreadCount(nextUnread);
      setHasLoaded(true);
      return { items, unreadCount: nextUnread };
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const poll = () => {
      refreshRecent({ silent: true }).catch(() => {
        if (!cancelled) setHasLoaded(true);
      });
    };

    // Initial load + single interval (cleared on unmount / logout leaving AdminLayout).
    poll();
    const intervalId = window.setInterval(poll, NOTIFICATION_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [refreshRecent]);

  /**
   * Local-only read sync.
   * Backend has no PATCH /api/messages/:id/read — opening GET /api/messages/:id
   * (and PATCH /api/messages/read-all) are the supported read flows.
   */
  const markAsReadLocal = useCallback(
    (id) => {
      const normalizedId = String(id ?? "").trim();
      if (!normalizedId) return null;

      setRecentItems((prev) => {
        let changed = false;
        const next = prev.map((item) => {
          if (String(item.id) !== normalizedId || item.isRead) return item;
          changed = true;
          return markItemRead(item);
        });
        if (!changed) return prev;
        setUnreadCount(countUnread(next));
        return next;
      });

      notifyListingListeners();
      return { success: true, optimistic: true };
    },
    [notifyListingListeners]
  );

  /** @deprecated Use markAsReadLocal — kept as alias for existing callers. */
  const markAsRead = markAsReadLocal;

  const markAllAsRead = useCallback(async () => {
    const result = await markAllMessagesAsRead();

    setRecentItems((prev) => prev.map(markItemRead));
    setUnreadCount(0);
    notifyListingListeners();

    // Re-sync from list so badge/drawer match backend after PATCH /read-all
    await refreshRecent({ silent: true }).catch(() => {});

    return result;
  }, [notifyListingListeners, refreshRecent]);

  const removeMessage = useCallback(
    async (id) => {
      const normalizedId = String(id ?? "").trim();
      if (!normalizedId) return null;

      const result = await deleteMessage(normalizedId);

      setRecentItems((prev) => {
        const next = prev.filter((item) => String(item.id) !== normalizedId);
        setUnreadCount(countUnread(next));
        return next;
      });

      notifyListingListeners();
      // Keep drawer/badge in sync with server after delete
      refreshRecent({ silent: true }).catch(() => {});
      return result;
    },
    [notifyListingListeners, refreshRecent]
  );

  const value = useMemo(
    () => ({
      recentItems,
      unreadCount,
      isLoading,
      hasLoaded,
      refreshRecent,
      markAsRead,
      markAsReadLocal,
      markAllAsRead,
      removeMessage,
      subscribe,
    }),
    [
      recentItems,
      unreadCount,
      isLoading,
      hasLoaded,
      refreshRecent,
      markAsRead,
      markAsReadLocal,
      markAllAsRead,
      removeMessage,
      subscribe,
    ]
  );

  return (
    <MessagesContext.Provider value={value}>{children}</MessagesContext.Provider>
  );
}

export function useMessages() {
  const context = useContext(MessagesContext);
  if (!context) {
    // Soft fallback so message details can still render if provider mount races.
    return {
      recentItems: [],
      unreadCount: 0,
      isLoading: false,
      hasLoaded: false,
      refreshRecent: async () => ({ items: [], unreadCount: 0 }),
      markAsReadLocal: () => null,
      markAsRead: () => null,
      markAllAsRead: async () => ({ success: true, unreadCount: 0 }),
      removeMessage: async (id) => deleteMessage(id),
      subscribe: () => () => {},
    };
  }
  return context;
}
