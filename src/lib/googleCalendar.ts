// src/lib/googleCalendar.ts

import { auth } from "./firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { db } from "./firebase";
import { doc, setDoc, getDoc, collection } from "firebase/firestore";
import { Todo } from "@/types";
import { dateUtils } from "@/utils/date";

interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
}

export class GoogleCalendarService {
  private static SCOPES = [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events",
  ];

  // アクセストークンの取得
  private static async getAccessToken(): Promise<string | null> {
    try {
      const provider = new GoogleAuthProvider();
      this.SCOPES.forEach((scope) => provider.addScope(scope));

      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);

      if (!credential) {
        throw new Error("No credentials returned from Google Auth");
      }

      return credential.accessToken;
    } catch (error) {
      console.error("Failed to get access token:", error);
      return null;
    }
  }

  // TodoとCalendarイベントのマッピングを保存
  private static async saveEventMapping(
    userId: string,
    todoId: string,
    eventId: string
  ): Promise<void> {
    const mappingRef = doc(collection(db, "calendar_mappings"), `${todoId}`);
    await setDoc(mappingRef, {
      userId,
      todoId,
      eventId,
      createdAt: new Date(),
      lastSynced: new Date(),
    });
  }

  // マッピング情報の取得
  private static async getEventMapping(todoId: string): Promise<string | null> {
    const mappingRef = doc(collection(db, "calendar_mappings"), `${todoId}`);
    const mappingDoc = await getDoc(mappingRef);

    if (mappingDoc.exists()) {
      return mappingDoc.data().eventId;
    }

    return null;
  }

  // カレンダーイベントの作成
  static async createCalendarEvent(todo: Todo): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken();
      if (!accessToken) return false;

      // イベントの終了時間を開始時間の30分後に設定
      const startTime = new Date(todo.dueDate);
      const endTime = dateUtils.addTime(startTime, 30, "minutes");

      const event: GoogleCalendarEvent = {
        id: crypto.randomUUID(),
        summary: todo.text,
        description: todo.description || `Todo App タスク: ${todo.text}`,
        start: {
          dateTime: startTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      };

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(event),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to create calendar event: ${response.statusText}`
        );
      }

      const createdEvent = await response.json();
      await this.saveEventMapping(todo.userId, todo.id, createdEvent.id);

      return true;
    } catch (error) {
      console.error("Failed to create calendar event:", error);
      return false;
    }
  }

  // カレンダーイベントの更新
  static async updateCalendarEvent(todo: Todo): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken();
      if (!accessToken) return false;

      const eventId = await this.getEventMapping(todo.id);
      if (!eventId) {
        return this.createCalendarEvent(todo);
      }

      const startTime = new Date(todo.dueDate);
      const endTime = dateUtils.addTime(startTime, 30, "minutes");

      const event: GoogleCalendarEvent = {
        id: eventId,
        summary: todo.text,
        description: `Todo App タスク: ${todo.text}${
          todo.completed ? " (完了)" : ""
        }`,
        start: {
          dateTime: startTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      };

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(event),
        }
      );

      return response.ok;
    } catch (error) {
      console.error("Failed to update calendar event:", error);
      return false;
    }
  }

  // カレンダーイベントの削除
  static async deleteCalendarEvent(todoId: string): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken();
      if (!accessToken) return false;

      const eventId = await this.getEventMapping(todoId);
      if (!eventId) return true;

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return response.ok;
    } catch (error) {
      console.error("Failed to delete calendar event:", error);
      return false;
    }
  }
}
