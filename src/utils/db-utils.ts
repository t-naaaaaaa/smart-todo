import {
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot,
  DocumentReference,
  collection,
  query,
  where,
  limit,
  getDocs,
  getDoc,
  FirestoreError,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// // 日付を含むオブジェクトの型
// type DateObject = {
//   [key: string]: Date | Timestamp | DateObject | null | undefined;
// };

// // DocumentDataの拡張型
// type ExtendedDocumentData = {
//   [key: string]: Date | Timestamp | Record<string, unknown> | null | undefined;
// };

// FirestoreのErrorコードの型
type FirestoreErrorCode =
  | "permission-denied"
  | "not-found"
  | "already-exists"
  | "failed-precondition"
  | "invalid-argument"
  | "unknown";

export const dbUtils = {
  // TimestampからDateへの変換
  timestampToDate<T extends Record<string, unknown>>(
    data: T
  ): Record<string, unknown> {
    const result: Record<string, unknown> = { ...data };
    Object.entries(data).forEach(([key, value]) => {
      if (value instanceof Timestamp) {
        result[key] = value.toDate();
      } else if (value && typeof value === "object") {
        result[key] = this.timestampToDate(value as Record<string, unknown>);
      }
    });
    return result;
  },

  // DateからTimestampへの変換
  dateToTimestamp<T extends Record<string, unknown>>(
    data: T
  ): Record<string, unknown> {
    const result: Record<string, unknown> = { ...data };
    Object.entries(data).forEach(([key, value]) => {
      if (value instanceof Date) {
        result[key] = Timestamp.fromDate(value);
      } else if (
        value &&
        typeof value === "object" &&
        !(value instanceof Timestamp)
      ) {
        result[key] = this.dateToTimestamp(value as Record<string, unknown>);
      }
    });
    return result;
  },

  // ドキュメントの型安全な変換
  convertDoc<T>(doc: QueryDocumentSnapshot<DocumentData>): T {
    const data = doc.data();
    return {
      id: doc.id,
      ...this.timestampToDate(data as Record<string, unknown>),
    } as T;
  },

  // バッチ処理のための配列分割
  splitArrayForBatch<T>(array: T[], batchSize = 500): T[][] {
    const result: T[][] = [];
    for (let i = 0; i < array.length; i += batchSize) {
      result.push(array.slice(i, i + batchSize));
    }
    return result;
  },

  // ドキュメントの存在確認
  async exists(docRef: DocumentReference): Promise<boolean> {
    const doc = await getDoc(docRef);
    return doc.exists();
  },

  // コレクション内の重複チェック
  async checkDuplicate(
    collectionName: string,
    field: string,
    value: string | number | boolean | null,
    excludeId?: string
  ): Promise<boolean> {
    const q = query(
      collection(db, collectionName),
      where(field, "==", value),
      limit(1)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return false;
    if (!excludeId) return true;
    return snapshot.docs[0].id !== excludeId;
  },

  // エラーハンドリング用のユーティリティ
  handleError(error: FirestoreError | Error): never {
    const errorMessages: Record<FirestoreErrorCode, string> = {
      "permission-denied": "権限がありません",
      "not-found": "指定されたドキュメントが見つかりません",
      "already-exists": "ドキュメントは既に存在します",
      "failed-precondition": "操作の前提条件が満たされていません",
      "invalid-argument": "無効な引数が指定されました",
      unknown: "不明なエラーが発生しました",
    };

    const code =
      ((error as FirestoreError).code as FirestoreErrorCode) || "unknown";
    const message = errorMessages[code] || error.message;

    throw new Error(`Database Error: ${message} (${code})`);
  },

  // クエリパラメータのサニタイズ
  sanitizeQueryValue<
    T extends string | number | boolean | Date | null | undefined
  >(value: T): string | number | boolean | Timestamp | null {
    if (value === null || value === undefined) {
      return null;
    }
    if (typeof value === "string") {
      return value.trim();
    }
    if (value instanceof Date) {
      return Timestamp.fromDate(value);
    }
    return value;
  },

  // 検索用のキーワード生成
  generateSearchKeywords(text: string): string[] {
    const normalized = text.toLowerCase().trim().replace(/\s+/g, " ");
    const words = normalized.split(" ");
    const keywords = new Set<string>();

    words.forEach((word) => {
      for (let i = 1; i <= word.length; i++) {
        keywords.add(word.substring(0, i));
      }
    });

    return Array.from(keywords);
  },
};
