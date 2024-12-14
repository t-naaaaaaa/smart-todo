// db.ts
"use client";

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
import { getFirebaseServices } from "./firebase"; // dbはここから取得する

// FirestoreTodoをTodoに変換するヘルパー関数
function firestoreTodoToTodo(firestoreTodo: FirestoreTodo): Todo {
  return {
    ...firestoreTodo,
    dueDate: firestoreTodo.dueDate.toDate(),
    createdAt: firestoreTodo.createdAt.toDate(),
    updatedAt: firestoreTodo.updatedAt.toDate(),
    completedAt: firestoreTodo.completedAt
      ? firestoreTodo.completedAt.toDate()
      : null,
  };
}

function getCollection(collectionName: string) {
  const { db } = getFirebaseServices();
  if (!db) {
    throw new globalThis.Error("Firestoreが初期化されていません");
  }
  return collection(db, collectionName);
}

export const todoDb = {
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
    return firestoreTodoToTodo(newTodo);
  },

  async get(todoId: string): Promise<Todo | null> {
    const todosRef = getCollection(COLLECTIONS.TODOS);
    const todoRef = doc(todosRef, todoId);
    const todoSnap = await getDoc(todoRef);

    if (!todoSnap.exists()) return null;
    const data = todoSnap.data() as FirestoreTodo;
    return firestoreTodoToTodo(data);
  },

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

    return querySnapshot.docs.map((docSnap) => {
      const data = docSnap.data() as FirestoreTodo;
      return firestoreTodoToTodo(data);
    });
  },

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

    for (const [key, value] of Object.entries(updates)) {
      if (key === "dueDate" || key === "completed") continue;
      if (value !== null && value !== undefined) {
        (updateData as Record<string, unknown>)[key] = value;
      }
    }

    await updateDoc(todoRef, updateData);
  },

  async delete(todoId: string): Promise<void> {
    const todosRef = getCollection(COLLECTIONS.TODOS);
    await deleteDoc(doc(todosRef, todoId));
  },

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
    return querySnapshot.docs.map((docSnap) => {
      const data = docSnap.data() as FirestoreTodo;
      return firestoreTodoToTodo(data);
    });
  },
};

export const userDb = {
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

  async get(userId: string): Promise<User | null> {
    const usersRef = getCollection(COLLECTIONS.USERS);
    const userRef = doc(usersRef, userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return null;

    const data = userSnap.data() as FirestoreUser;
    return {
      ...data,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    };
  },
};
