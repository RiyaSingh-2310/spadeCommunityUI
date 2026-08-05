import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  deleteDemoMessage,
  getDemoRecentMessages,
  markDemoMessageAsRead,
} from "../data/demoMessages";

const MessagesContext = createContext(null);

function countUnread(items) {
  return items.filter((item) => !item.isRead).length;
}

export function MessagesProvider({ children }) {
  const [recentItems, setRecentItems] = useState(() => getDemoRecentMessages());
  const [unreadCount, setUnreadCount] = useState(() =>
    countUnread(getDemoRecentMessages())
  );
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

  const refreshRecent = useCallback(async () => {
    const items = getDemoRecentMessages();
    setRecentItems(items);
    setUnreadCount(countUnread(items));
    return { items, unreadCount: countUnread(items) };
  }, []);

  const markAsRead = useCallback(
    async (id) => {
      const normalizedId = String(id ?? "").trim();
      if (!normalizedId) return null;

      markDemoMessageAsRead(normalizedId);
      const items = getDemoRecentMessages();
      setRecentItems(items);
      setUnreadCount(countUnread(items));
      notifyListingListeners();
      return { success: true, item: getDemoRecentMessages().find(
        (item) => String(item.id) === normalizedId
      ) ?? null };
    },
    [notifyListingListeners]
  );

  const markAllAsRead = useCallback(async () => {
    getDemoRecentMessages().forEach((item) => {
      markDemoMessageAsRead(item.id);
    });
    const items = getDemoRecentMessages();
    setRecentItems(items);
    setUnreadCount(0);
    notifyListingListeners();
    return { success: true, unreadCount: 0 };
  }, [notifyListingListeners]);

  const removeMessage = useCallback(
    async (id) => {
      const normalizedId = String(id ?? "").trim();
      if (!normalizedId) return null;

      deleteDemoMessage(normalizedId);
      const items = getDemoRecentMessages();
      setRecentItems(items);
      setUnreadCount(countUnread(items));
      notifyListingListeners();
      return { success: true };
    },
    [notifyListingListeners]
  );

  const value = useMemo(
    () => ({
      recentItems,
      unreadCount,
      isLoading: false,
      hasLoaded: true,
      refreshRecent,
      markAsRead,
      markAllAsRead,
      removeMessage,
      subscribe,
    }),
    [
      recentItems,
      unreadCount,
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
