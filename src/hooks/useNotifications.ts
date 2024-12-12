// src/hooks/useNotifications.ts

import { useState, useEffect, useCallback } from "react";
import { Todo } from "@/types";
import { todoDb } from "@/lib/db";

interface NotificationSettings {
  enabled: boolean;
  urgentNotifications: boolean; // 2時間以内の通知
  overdueNotifications: boolean; // 期限切れ通知
  reminderTiming: number; // minutes before due date
}

interface UseNotificationsProps {
  userId: string;
}

export function useNotifications({ userId }: UseNotificationsProps) {
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: false,
    urgentNotifications: true,
    overdueNotifications: true,
    reminderTiming: 30,
  });
  const [permission, setPermission] =
    useState<NotificationPermission>("default");

  // 通知権限の確認と取得
  const requestPermission = useCallback(async () => {
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === "granted";
    } catch (error) {
      console.error("Failed to request notification permission:", error);
      return false;
    }
  }, []);

  // 通知の送信
  const sendNotification = useCallback(
    (title: string, options: NotificationOptions) => {
      if (permission === "granted" && settings.enabled) {
        new Notification(title, options);
      }
    },
    [permission, settings.enabled]
  );

  // 緊急タスクの通知チェック
  const checkUrgentTodos = useCallback(async () => {
    if (!settings.urgentNotifications) return;

    const todos = await todoDb.listByUser(userId);
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    todos.forEach((todo) => {
      if (!todo.completed && new Date(todo.dueDate) <= twoHoursFromNow) {
        sendNotification("緊急タスクの通知", {
          body: `「${todo.text}」の期限が2時間以内に迫っています`,
          icon: "/notification-icon.png",
          tag: `urgent-${todo.id}`,
          renotify: true,
        });
      }
    });
  }, [userId, settings.urgentNotifications, sendNotification]);

  // 期限切れタスクの通知チェック
  const checkOverdueTodos = useCallback(async () => {
    if (!settings.overdueNotifications) return;

    const todos = await todoDb.listByUser(userId);
    const now = new Date();

    todos.forEach((todo) => {
      if (!todo.completed && new Date(todo.dueDate) < now) {
        sendNotification("期限切れタスクの通知", {
          body: `「${todo.text}」が期限切れです`,
          icon: "/notification-icon.png",
          tag: `overdue-${todo.id}`,
          renotify: true,
        });
      }
    });
  }, [userId, settings.overdueNotifications, sendNotification]);

  // リマインダーの設定
  const setReminder = useCallback(
    (todo: Todo) => {
      if (!settings.enabled) return;

      const dueDate = new Date(todo.dueDate);
      const reminderTime = new Date(
        dueDate.getTime() - settings.reminderTiming * 60 * 1000
      );
      const now = new Date();

      if (reminderTime > now) {
        const timeoutId = setTimeout(() => {
          sendNotification("タスクリマインダー", {
            body: `「${todo.text}」の期限が${settings.reminderTiming}分後に迫っています`,
            icon: "/notification-icon.png",
            tag: `reminder-${todo.id}`,
            renotify: true,
          });
        }, reminderTime.getTime() - now.getTime());

        return () => clearTimeout(timeoutId);
      }
    },
    [settings, sendNotification]
  );

  // 定期的なチェック
  useEffect(() => {
    if (!settings.enabled) return;

    // 10分ごとにチェック
    const interval = setInterval(() => {
      checkUrgentTodos();
      checkOverdueTodos();
    }, 10 * 60 * 1000);

    // 初回チェック
    checkUrgentTodos();
    checkOverdueTodos();

    return () => clearInterval(interval);
  }, [settings.enabled, checkUrgentTodos, checkOverdueTodos]);

  // 通知設定の更新
  const updateSettings = useCallback(
    async (newSettings: Partial<NotificationSettings>) => {
      setSettings((prev) => ({ ...prev, ...newSettings }));

      if (newSettings.enabled && permission !== "granted") {
        await requestPermission();
      }
    },
    [permission, requestPermission]
  );

  return {
    settings,
    updateSettings,
    setReminder,
    permission,
    requestPermission,
  };
}
