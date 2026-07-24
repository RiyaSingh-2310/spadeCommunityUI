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
  AUTH_SESSION_CHANGED_EVENT,
  getAuthToken,
} from "../../../services/auth/authStorage";
import { toastApiError } from "../../../services/toast/apiToast";
import {
  deleteMessage as deleteMessageRequest,
  getMessages,
  markAllMessagesAsRead as markAllMessagesAsReadRequest,
  markMessageAsRead as markMessageAsReadRequest,
} from "../services/messagesApi";

const HEADER_PAGE_SIZE = 20;

const MessagesContext = createContext(null);

export function MessagesProvider({ children }) {
  const [recentItems, setRecentItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const listenersRef = useRef(new Set());
  const inflightRef = useRef(null);
  const requestIdRef = useRef(0);

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

  const applyUnreadCount = useCallback((nextCount, items = null) => {
    if (Number.isFinite(Number(nextCount))) {
      setUnreadCount(Math.max(0, Number(nextCount)));
      return;
    }
    if (Array.isArray(items)) {
      setUnreadCount(items.filter((item) => !item.isRead).length);
    }
  }, []);

  const refreshRecent = useCallback(
    async ({ silent = false } = {}) => {
      if (!getAuthToken()) {
        setRecentItems([]);
        setUnreadCount(0);
        setHasLoaded(true);
        setIsLoading(false);
        return { items: [], unreadCount: 0 };
      }

      if (inflightRef.current) {
        return inflightRef.current;
      }

      const requestId = ++requestIdRef.current;
      if (!silent) setIsLoading(true);

      const requestPromise = (async () => {
        try {
          const result = await getMessages({
            page: 1,
            limit: HEADER_PAGE_SIZE,
          });
          if (requestId !== requestIdRef.current) {
            return result;
          }

          const items = Array.isArray(result.items) ? result.items : [];
          setRecentItems(items);
          applyUnreadCount(result.unreadCount, items);
          setHasLoaded(true);
          return result;
        } catch (error) {
          if (requestId === requestIdRef.current) {
            if (!silent) toastApiError(error);
            setHasLoaded(true);
          }
          throw error;
        } finally {
          if (requestId === requestIdRef.current) {
            setIsLoading(false);
            inflightRef.current = null;
          }
        }
      })();

      inflightRef.current = requestPromise;
      return requestPromise;
    },
    [applyUnreadCount]
  );

  useEffect(() => {
    refreshRecent({ silent: true }).catch(() => {});

    const onAuthChange = () => {
      refreshRecent({ silent: true }).catch(() => {});
    };

    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, onAuthChange);
    return () => {
      window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, onAuthChange);
    };
  }, [refreshRecent]);

  const markAsRead = useCallback(
    async (id) => {
      const normalizedId = String(id ?? "").trim();
      if (!normalizedId) return null;

      setRecentItems((prev) =>
        prev.map((item) =>
          String(item.id) === normalizedId
            ? { ...item, isRead: true, read: true }
            : item
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      try {
        const result = await markMessageAsReadRequest(normalizedId);
        if (result.item) {
          setRecentItems((prev) =>
            prev.map((item) =>
              String(item.id) === normalizedId ? { ...item, ...result.item } : item
            )
          );
        }
        applyUnreadCount(result.unreadCount);
        notifyListingListeners();
        return result;
      } catch (error) {
        await refreshRecent({ silent: true }).catch(() => {});
        throw error;
      }
    },
    [applyUnreadCount, notifyListingListeners, refreshRecent]
  );

  const markAllAsRead = useCallback(async () => {
    setRecentItems((prev) =>
      prev.map((item) => ({ ...item, isRead: true, read: true }))
    );
    setUnreadCount(0);

    try {
      const result = await markAllMessagesAsReadRequest();
      applyUnreadCount(result.unreadCount ?? 0);
      notifyListingListeners();
      return result;
    } catch (error) {
      await refreshRecent({ silent: true }).catch(() => {});
      throw error;
    }
  }, [applyUnreadCount, notifyListingListeners, refreshRecent]);

  const removeMessage = useCallback(
    async (id) => {
      const normalizedId = String(id ?? "").trim();
      if (!normalizedId) return null;

      const previous = recentItems;
      setRecentItems((prev) =>
        prev.filter((item) => String(item.id) !== normalizedId)
      );
      setUnreadCount((prev) => {
        const removed = previous.find((item) => String(item.id) === normalizedId);
        if (removed && !removed.isRead) return Math.max(0, prev - 1);
        return prev;
      });

      try {
        const result = await deleteMessageRequest(normalizedId);
        applyUnreadCount(result.unreadCount);
        notifyListingListeners();
        return result;
      } catch (error) {
        setRecentItems(previous);
        await refreshRecent({ silent: true }).catch(() => {});
        throw error;
      }
    },
    [applyUnreadCount, notifyListingListeners, recentItems, refreshRecent]
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
