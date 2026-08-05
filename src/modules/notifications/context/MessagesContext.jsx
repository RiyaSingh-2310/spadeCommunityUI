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
    refreshRecent({ silent: true }).catch(() => {
      setHasLoaded(true);
    });
  }, [refreshRecent]);

  const markAsRead = useCallback(
    async (id) => {
      const normalizedId = String(id ?? "").trim();
      if (!normalizedId) return null;

      let result = null;
      try {
        result = await markMessageAsRead(normalizedId);
      } catch {
        // Keep optimistic UI update even if dedicated mark-read endpoint is unavailable.
        result = { success: true, optimistic: true };
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
      return result;
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
    refreshRecent({ silent: true }).catch(() => {});

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
      return result;
    },
    [notifyListingListeners]
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
