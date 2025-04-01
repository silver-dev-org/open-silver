import React, { useEffect, useState } from "react";

interface NotificationProps {
  message: string;
  type: "success" | "error" | "info" | "warning";
  duration?: number;
  onClose?: () => void;
}

const Notification: React.FC<NotificationProps> = ({
  message,
  type,
  duration = 3000,
  onClose,
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), 10);
    const hideTimer = setTimeout(() => {
      if (onClose) onClose();
    }, duration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [duration, onClose]);

  const getColor = (type: NotificationProps["type"]) => {
    switch (type) {
      case "success":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      case "info":
        return "bg-blue-500";
      case "warning":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div
      className={`fixed top-32 left-1/2 transform -translate-x-1/2 px-4 py-2 text-white rounded shadow-lg ${getColor(
        type
      )} transition-opacity duration-500 ease-in-out`}
      style={{ opacity: visible ? 1 : 0 }}
    >
      <div className="flex items-center justify-between">
        <span>{message}</span>
        <button
          onClick={() => {
            setVisible(false);
            if (onClose) onClose();
          }}
          className="ml-4 text-xl leading-none hover:text-gray-200"
          aria-label="Close Notification"
        >
          &times;
        </button>
      </div>
    </div>
  );
};

export default Notification;
