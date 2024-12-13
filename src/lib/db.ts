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
  Timestamp,
  serverTimestamp,
  collection,
} from "firebase/firestore";

import { COLLECTIONS } from "./db/schema";
import { FirestoreTodo, FirestoreUser } from "@/types/database";
import { Todo, User, TodoCategory } from "@/types";
import { ensureFirebaseInitialized } from "./firebase";

// Firestore データ変換ユーティリティ
const convertTimestampToDate = <T>(
  data: FirestoreTodo | { [key: string]: unknown }
): T => {
  const converted = { ...data };
  Object.keys(data).forEach((key) => {
    const value = data[key as keyof typeof data];
    if (value instanceof Timestamp) {
      converted[key as keyof typeof converted] = value.toDate();
    }
  });
  return converted as T;
};

// コレクション参照を取得する関数
const getCollection = (collectionName: string) => {
  const { db } = ensureFirebaseInitialized();
  return collection(db, collectionName);
};

// Todoデータベース操作
export const todoDb = {
  // Todo作成
  async create(
    userId: string,
    todo: Omit<Todo, "id" | "userId" | "createdAt" | "updatedAt">
  ): Promise<Todo> {
    const todosRef = getCollection(COLLECTIONS.TODOS);
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
    const todosRef = getCollection(COLLECTIONS.TODOS);
    const todoRef = doc(todosRef, todoId);
    const todoSnap = await getDoc(todoRef);

    if (!todoSnap.exists()) return null;

    return convertTimestampToDate<Todo>(todoSnap.data());
  },

  // ユーザーのTodo一覧取得
  async listByUser(userId: string, category?: TodoCategory): Promise<Todo[]> {
    const todosRef = getCollection(COLLECTIONS.TODOS);
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
  async update(
    todoId: string,
    updates: Partial<Omit<Todo, "id" | "createdAt" | "updatedAt">>
  ): Promise<void> {
    const todosRef = getCollection(COLLECTIONS.TODOS);
    const todoRef = doc(todosRef, todoId);

    const updateData: Partial<FirestoreTodo> = {
      updatedAt: serverTimestamp() as Timestamp,
    };

    if (updates.dueDate instanceof Date) {
      updateData.dueDate = Timestamp.fromDate(updates.dueDate);
    }

    if (updates.completed !== undefined) {
      updateData.completed = updates.completed;
      updateData.completedAt = updates.completed
        ? Timestamp.fromDate(new Date())
        : null;
    }

    Object.entries(updates).forEach(([key, value]) => {
      if (
        key !== "dueDate" &&
        key !== "completed" &&
        value !== null &&
        value !== undefined
      ) {
        (updateData as Record<string, unknown>)[key] = value;
      }
    });

    await updateDoc(todoRef, updateData);
  },

  // Todo削除
  async delete(todoId: string): Promise<void> {
    const todosRef = getCollection(COLLECTIONS.TODOS);
    await deleteDoc(doc(todosRef, todoId));
  },

  // 緊急タスクの取得
  async getUrgentTodos(userId: string): Promise<Todo[]> {
    const todosRef = getCollection(COLLECTIONS.TODOS);
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
    const usersRef = getCollection(COLLECTIONS.USERS);
    const userRef = doc(usersRef, user.id);
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
    const usersRef = getCollection(COLLECTIONS.USERS);
    const userRef = doc(usersRef, userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return null;

    const data = userSnap.data();
    if (!data) return null;

    const convertedData: FirestoreUser = {
      id: userId, // 追加
      email: data.email ?? "", // 追加
      displayName: data.displayName, // 追加
      photoURL: data.photoURL, // 追加
      createdAt:
        data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.now(),
      updatedAt:
        data.updatedAt instanceof Timestamp ? data.updatedAt : Timestamp.now(),
    };

    const user: User = {
      ...convertedData,
      createdAt: convertedData.createdAt.toDate(),
      updatedAt: convertedData.updatedAt.toDate(),
    };

    return user;
  },
};
