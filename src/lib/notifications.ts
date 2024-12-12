// src/lib/notifications.ts

import { Todo } from "@/types";
import { dateUtils } from "@/utils/date";

type NotificationType =
  | "urgent"
  | "overdue"
  | "reminder"
  | "update"
  | "complete";

interface NotificationPayload {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  todoId?: string;
}

export class NotificationService {
  private static instance: NotificationService;
  private permission: NotificationPermission = "default";

  private constructor() {
    this.initializePermission();
  }

  // シングルトンインスタンスの取得
  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // 通知権限の初期化
  private async initializePermission(): Promise<void> {
    if (!("Notification" in window)) {
      console.warn("このブラウザは通知をサポートしていません");
      return;
    }

    this.permission = await Notification.requestPermission();
  }

  // 通知の送信
  private async sendNotification(payload: NotificationPayload): Promise<void> {
    if (this.permission !== "granted") {
      console.warn("通知の権限がありません");
      return;
    }

    const options: NotificationOptions = {
      body: payload.message,
      icon: "/notification-icon.png",
      tag: payload.id,
      timestamp: payload.timestamp.getTime(),
      requireInteraction: true,
      data: {
        type: payload.type,
        todoId: payload.todoId,
      },
    };

    const notification = new Notification(payload.title, options);

    notification.onclick = () => {
      window.focus();
      notification.close();
      // Todoの詳細ページに遷移するなどのアクション
      if (payload.todoId) {
        window.location.href = `/dashboard?todo=${payload.todoId}`;
      }
    };
  }

  // 緊急タスクの通知
  async notifyUrgentTodo(todo: Todo): Promise<void> {
    await this.sendNotification({
      id: `urgent-${todo.id}`,
      type: "urgent",
      title: "緊急タスクの通知",
      message: `「${todo.text}」の期限が2時間以内に迫っています`,
      timestamp: new Date(),
      todoId: todo.id,
    });
  }

  // 期限切れの通知
  async notifyOverdueTodo(todo: Todo): Promise<void> {
    await this.sendNotification({
      id: `overdue-${todo.id}`,
      type: "overdue",
      title: "期限切れの通知",
      message: `「${todo.text}」が期限を過ぎています`,
      timestamp: new Date(),
      todoId: todo.id,
    });
  }

  // リマインダー通知
  async notifyReminder(todo: Todo, minutesBefore: number): Promise<void> {
    await this.sendNotification({
      id: `reminder-${todo.id}-${minutesBefore}`,
      type: "reminder",
      title: "リマインダー",
      message: `「${todo.text}」の期限まであと${minutesBefore}分です`,
      timestamp: new Date(),
      todoId: todo.id,
    });
  }

  // タスク更新の通知
  async notifyUpdate(todo: Todo): Promise<void> {
    await this.sendNotification({
      id: `update-${todo.id}`,
      type: "update",
      title: "タスクが更新されました",
      message: `「${todo.text}」が更新されました`,
      timestamp: new Date(),
      todoId: todo.id,
    });
  }

  // タスク完了の通知
  async notifyComplete(todo: Todo): Promise<void> {
    await this.sendNotification({
      id: `complete-${todo.id}`,
      type: "complete",
      title: "タスク完了",
      message: `「${todo.text}」を完了しました`,
      timestamp: new Date(),
      todoId: todo.id,
    });
  }

  // 通知のスケジュール
  scheduleTodoNotifications(todo: Todo): void {
    const now = new Date();
    const dueDate = new Date(todo.dueDate);

    // 期限切れチェック用のタイマー
    if (!todo.completed) {
      const overdueTimeout = dueDate.getTime() - now.getTime();
      if (overdueTimeout > 0) {
        setTimeout(() => {
          this.notifyOverdueTodo(todo);
        }, overdueTimeout);
      }
    }

    // 緊急タスクチェック（2時間前）
    const twoHoursBeforeDeadline = dateUtils.addTime(dueDate, -2, "hours");
    const urgentTimeout = twoHoursBeforeDeadline.getTime() - now.getTime();
    if (urgentTimeout > 0) {
      setTimeout(() => {
        this.notifyUrgentTodo(todo);
      }, urgentTimeout);
    }

    // リマインダー通知（30分前）
    const reminderTime = dateUtils.addTime(dueDate, -30, "minutes");
    const reminderTimeout = reminderTime.getTime() - now.getTime();
    if (reminderTimeout > 0) {
      setTimeout(() => {
        this.notifyReminder(todo, 30);
      }, reminderTimeout);
    }
  }

  // 通知の権限チェック
  async checkPermission(): Promise<boolean> {
    if (this.permission === "default") {
      this.permission = await Notification.requestPermission();
    }
    return this.permission === "granted";
  }
}

// シングルトンインスタンスをエクスポート
export const notificationService = NotificationService.getInstance();
