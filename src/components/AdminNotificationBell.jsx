import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAdminSocket } from "../hooks/useAdminSocket";
import { iconsImgs } from "../utils/images";

// Helper function to format relative time
const getRelativeTime = (isoString) => {
  if (!isoString) return "Vừa xong";

  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) return "Vừa xong";
    if (diffMinutes < 60) return `${diffMinutes} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;

    // Format as dd/mm/yyyy
    return date.toLocaleDateString("vi-VN");
  } catch {
    return "Vừa xong";
  }
};

// Type configuration for notifications
const TYPE_CONFIG = {
  VEHICLE_APPROVAL: {
    icon: "🏍️",
    color: "text-pumpkin",
    label: "Duyệt xe",
  },
  TRIP_ISSUE: {
    icon: "🚨",
    color: "text-red-400",
    label: "Sự cố",
  },
  NEW_USER: {
    icon: "👤",
    color: "text-blue-400",
    label: "Người dùng",
  },
};

const AdminNotificationBell = () => {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const bellButtonRef = useRef(null);

  // Use the WebSocket hook
  const { notifications, unreadCount, markAllRead, clearNotifications } =
    useAdminSocket(accessToken);

  // Handle bell icon click
  const handleBellClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
    if (!isDropdownOpen) {
      // Mark as read when opening dropdown
      markAllRead();
    }
  };

  // Handle notification item click
  const handleNotificationClick = (notification) => {
    if (notification.link) {
      navigate(notification.link);
      setIsDropdownOpen(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        bellButtonRef.current &&
        !bellButtonRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <div className="relative ml-[18px]">
      {/* Bell Button */}
      <button
        ref={bellButtonRef}
        type="button"
        className="relative flex items-center"
        onClick={handleBellClick}
        aria-label="Notifications"
      >
        <img
          src={iconsImgs.bell}
          alt="notification"
          className="w-6 transition-all hover:brightness-0 hover:invert"
        />

        {/* Badge with unread count */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center min-w-[20px] h-5 px-1 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isDropdownOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 top-10 w-80 bg-primary border border-white/10 rounded-lg shadow-2xl z-50"
        >
          {/* Dropdown Header */}
          <div className="flex items-center justify-between border-b border-white/10 p-4">
            <h3 className="text-white font-semibold">Thông báo hệ thống</h3>
            {notifications.length > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-pumpkin hover:text-pumpkin/80 transition-colors"
              >
                Đánh dấu đã đọc
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-silver">
                <p>Chưa có thông báo nào</p>
              </div>
            ) : (
              <ul className="divide-y divide-white/10">
                {notifications.map((notification) => {
                  const config = TYPE_CONFIG[notification.type] || {
                    icon: "📬",
                    color: "text-silver",
                    label: "Thông báo",
                  };

                  return (
                    <li
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className="p-4 cursor-pointer hover:bg-white/5 transition-colors border-l-2 border-transparent hover:border-pumpkin"
                    >
                      <div className="flex gap-3">
                        {/* Icon */}
                        <div className="text-xl flex-shrink-0">
                          {config.icon}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          {/* Title with type label */}
                          <div className="flex items-center gap-2 mb-1">
                            <p
                              className={`text-sm font-semibold ${config.color}`}
                            >
                              {notification.title}
                            </p>
                            <span className="text-xs bg-white/10 text-silver px-2 py-0.5 rounded">
                              {config.label}
                            </span>
                          </div>

                          {/* Message - truncate to 1 line */}
                          <p className="text-sm text-silver line-clamp-1 mb-1">
                            {notification.message}
                          </p>

                          {/* Timestamp */}
                          <time className="text-xs text-silver/60">
                            {getRelativeTime(notification.timestamp)}
                          </time>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Footer - Clear all button (only show if there are notifications) */}
          {notifications.length > 0 && (
            <div className="border-t border-white/10 p-3">
              <button
                onClick={clearNotifications}
                className="w-full text-sm text-silver hover:text-white transition-colors py-2"
              >
                Xóa tất cả
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminNotificationBell;
