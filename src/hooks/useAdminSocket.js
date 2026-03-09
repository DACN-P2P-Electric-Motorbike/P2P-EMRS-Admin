import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client"; // ← fix import

export const useAdminSocket = (accessToken) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!accessToken) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    const baseURL =
      import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";
    const socketBaseURL = baseURL.replace(/\/api\/?$/, "");
    const socketURL = `${socketBaseURL}/notifications`;

    console.log("🔌 Connecting to:", socketURL); // ← log để verify

    socketRef.current = io(socketURL, {
      auth: { token: accessToken },
      transports: ["websocket", "polling"], // ← thêm dòng này
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current.on("connect", () => {
      console.log("✅ Connected, joining admin room...");
      setIsConnected(true);
      socketRef.current.emit("join_admin_room", {});
    });

    // Lắng nghe cả 2 — "connect_error" và "error"
    socketRef.current.on("connect_error", (error) => {
      console.error("❌ connect_error:", error.message, error.data);
      setIsConnected(false);
    });

    socketRef.current.on("error", (error) => {
      console.error("❌ socket error:", error);
    });

    socketRef.current.on("disconnect", (reason) => {
      console.log("⚠️ Disconnected, reason:", reason); // ← log reason để debug thêm
      setIsConnected(false);
    });

    socketRef.current.on("admin_alert", (data) => {
      console.log("📬 admin_alert:", data);
      setNotifications((prev) =>
        [{ id: Date.now(), ...data, read: false }, ...prev].slice(0, 50),
      );
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [accessToken]);

  const markAllRead = () => {
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  return {
    notifications,
    unreadCount,
    markAllRead,
    clearNotifications,
    isConnected,
  };
};
