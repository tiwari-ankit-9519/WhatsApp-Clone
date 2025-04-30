import { useState, useEffect, useCallback } from "react";

export function useSettings() {
  const getStoredSetting = useCallback((key, defaultValue) => {
    try {
      const stored = localStorage.getItem(`setting_${key}`);
      return stored !== null ? JSON.parse(stored) : defaultValue;
    } catch (e) {
      console.error(`Error retrieving setting ${key}:`, e);
      return defaultValue;
    }
  }, []);

  const [notifications, setNotifications] = useState(() =>
    getStoredSetting("notifications", true)
  );

  const [messageSound, setMessageSound] = useState(() =>
    getStoredSetting("messageSound", true)
  );

  const [readReceipts, setReadReceipts] = useState(() =>
    getStoredSetting("readReceipts", true)
  );

  const [typingIndicator, setTypingIndicator] = useState(() =>
    getStoredSetting("typingIndicator", true)
  );

  useEffect(() => {
    localStorage.setItem(
      `setting_notifications`,
      JSON.stringify(notifications)
    );
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(`setting_messageSound`, JSON.stringify(messageSound));
  }, [messageSound]);

  useEffect(() => {
    localStorage.setItem(`setting_readReceipts`, JSON.stringify(readReceipts));
  }, [readReceipts]);

  useEffect(() => {
    localStorage.setItem(
      `setting_typingIndicator`,
      JSON.stringify(typingIndicator)
    );
  }, [typingIndicator]);

  const canShowNotifications = useCallback(() => {
    return (
      notifications &&
      "Notification" in window &&
      Notification.permission === "granted"
    );
  }, [notifications]);

  const playNotificationSound = useCallback(() => {
    if (messageSound) {
      try {
        const audio = new Audio("/notification.mp3");
        audio.volume = 0.5;
        audio.play().catch((e) => console.log("Audio play prevented:", e));
      } catch (e) {
        console.log("Could not play notification sound:", e);
      }
    }
  }, [messageSound]);

  const requestNotificationPermission = useCallback(async () => {
    if ("Notification" in window && Notification.permission !== "granted") {
      try {
        const permission = await Notification.requestPermission();
        return permission === "granted";
      } catch (e) {
        console.error("Error requesting notification permission:", e);
        return false;
      }
    }
    return Notification.permission === "granted";
  }, []);

  return {
    notifications,
    messageSound,
    readReceipts,
    typingIndicator,

    setNotifications,
    setMessageSound,
    setReadReceipts,
    setTypingIndicator,

    canShowNotifications,
    playNotificationSound,
    requestNotificationPermission,

    getSetting: getStoredSetting,
  };
}
