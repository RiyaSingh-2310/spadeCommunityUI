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
  markMessageAsRead,
} from "../services/messagesApi";

const MessagesContext = createContext(null);
const RECENT_LIMIT = 100;
const NOTIFICATION_POLL_INTERVAL_MS = 60_000;

function countUnread(items) {
  return (Array.isArray(items) ? items : []).filter((item) => !item.isRead).length;
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

  const markAsRead = useCallback(
    async (id) => {
      const normalizedId = String(id ?? "").trim();
      if (!normalizedId) return null;

      try {
        await markMessageAsRead(normalizedId);
      } catch {
        // Dedicated mark-read endpoint may be unavailable; keep optimistic UI.
      }

      setRecentItems((prev) => {
        const next = prev.map((item) =>
          String(item.id) === normalizedId
            ? {
                ...item,
                isRead: true,
                read: true,
                readStatus: "Read",
              }
            : item
        );
        setUnreadCount(countUnread(next));
        return next;
      });

      notifyListingListeners();
      return { success: true };
    },
    [notifyListingListeners]
  );

  const markAllAsRead = useCallback(async () => {
    const result = await markAllMessagesAsRead();

    setRecentItems((prev) =>
      prev.map((item) => ({
        ...item,
        isRead: true,
        read: true,
        readStatus: "Read",
      }))
    );
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
    throw new Error("useMessages must be used within MessagesProvider");
  }
  return context;
}
