// src/lib/db.ts

import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";

import { collections, COLLECTIONS } from "./db/schema";
import { FirestoreTodo, FirestoreUser } from "@/types/database";
import { Todo, User, TodoCategory } from "@/types";

// Firestore データ変換ユーティリティ
const convertTimestampToDate = <T>(data: any): T => {
  const converted = { ...data };
  Object.keys(data).forEach((key) => {
    if (data[key] instanceof Timestamp) {
      converted[key] = data[key].toDate();
    }
  });
  return converted as T;
};

// Todoデータベース操作
export const todoDb = {
  // Todo作成
  async create(
    userId: string,
    todo: Omit<Todo, "id" | "userId" | "createdAt" | "updatedAt">
  ): Promise<Todo> {
    const todosRef = collections.todos();
    const newTodoRef = doc(todosRef);

    const newTodo: FirestoreTodo = {
      id: newTodoRef.id,
      userId,
      ...todo,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
      dueDate: Timestamp.fromDate(todo.dueDate),
      completedAt: todo.completed ? Timestamp.fromDate(new Date()) : null,
      isCalendarSynced: false,
    };

    await setDoc(newTodoRef, newTodo);
    return convertTimestampToDate<Todo>(newTodo);
  },

  // Todo取得
  async get(todoId: string): Promise<Todo | null> {
    const todoRef = doc(collections.todos(), todoId);
    const todoSnap = await getDoc(todoRef);

    if (!todoSnap.exists()) return null;

    return convertTimestampToDate<Todo>(todoSnap.data());
  },

  // ユーザーのTodo一覧取得（カテゴリでフィルタ可能）
  async listByUser(userId: string, category?: TodoCategory): Promise<Todo[]> {
    const todosRef = collections.todos();
    const constraints = [
      where("userId", "==", userId),
      orderBy("dueDate", "asc"),
    ];

    if (category) {
      constraints.push(where("category", "==", category));
    }

    const q = query(todosRef, ...constraints);
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) =>
      convertTimestampToDate<Todo>(doc.data())
    );
  },

  // Todo更新
  async update(todoId: string, updates: Partial<Todo>): Promise<void> {
    const todoRef = doc(collections.todos(), todoId);
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp(),
    };

    if (updates.dueDate) {
      updateData.dueDate = Timestamp.fromDate(updates.dueDate);
    }
    if (updates.completed !== undefined) {
      updateData.completedAt = updates.completed
        ? Timestamp.fromDate(new Date())
        : null;
    }

    await updateDoc(todoRef, updateData);
  },

  // Todo削除
  async delete(todoId: string): Promise<void> {
    await deleteDoc(doc(collections.todos(), todoId));
  },

  // 緊急タスクの取得（2時間以内）
  async getUrgentTodos(userId: string): Promise<Todo[]> {
    const todosRef = collections.todos();
    const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);

    const q = query(
      todosRef,
      where("userId", "==", userId),
      where("completed", "==", false),
      where("dueDate", "<=", Timestamp.fromDate(twoHoursFromNow)),
      orderBy("dueDate", "asc")
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) =>
      convertTimestampToDate<Todo>(doc.data())
    );
  },
};

// ユーザーデータベース操作
export const userDb = {
  // ユーザー作成/更新
  async createOrUpdate(
    user: Omit<User, "createdAt" | "updatedAt">
  ): Promise<void> {
    const userRef = doc(collections.users(), user.id);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      const newUser: FirestoreUser = {
        ...user,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
      };
      await setDoc(userRef, newUser);
    } else {
      await updateDoc(userRef, {
        ...user,
        updatedAt: serverTimestamp(),
      });
    }
  },

  // ユーザー取得
  async get(userId: string): Promise<User | null> {
    const userRef = doc(collections.users(), userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return null;

    return convertTimestampToDate<User>(userSnap.data());
  },
};