import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db, firebaseConfigured } from "@/lib/firebase";

export type CloudEnvelope<T> = {
  data: T;
  schemaVersion: number;
  updatedAt?: unknown;
};

export async function loadCloudData<T>(userId: string, key: string): Promise<T | null> {
  if (!firebaseConfigured || !db) return null;

  const snapshot = await getDoc(doc(db, "users", userId, "modules", key));
  if (!snapshot.exists()) return null;

  const envelope = snapshot.data() as CloudEnvelope<T>;
  return envelope.data ?? null;
}

export async function saveCloudData<T>(userId: string, key: string, data: T): Promise<void> {
  if (!firebaseConfigured || !db) return;

  await setDoc(
    doc(db, "users", userId, "modules", key),
    {
      data,
      schemaVersion: 1,
      updatedAt: serverTimestamp(),
    } satisfies CloudEnvelope<T>,
    { merge: true },
  );
}
