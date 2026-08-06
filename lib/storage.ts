import { collection, doc, getDoc, getDocs, limit, orderBy, query, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import type { AppData, Bill, Task } from "./types";

const STORAGE_KEY = "abrar-os-data-v1";
const STORAGE_UPDATED_KEY = "abrar-os-data-updated-at";
const BACKUP_MARKER_PREFIX = "abrar-os-cloud-backup";
const CLOUD_SAVE_DEBOUNCE_MS = 700;
const CLOUD_SAVE_MAX_ATTEMPTS = 3;
const today = () => new Date().toISOString().slice(0, 10);
const now = () => new Date().toISOString();
let cloudSaveQueue: Promise<void> = Promise.resolve();
let cloudSaveTimer: ReturnType<typeof setTimeout> | null = null;
let pendingCloudSave: DataSnapshot | null = null;
let lifecycleListenersInstalled = false;

export type DataSnapshot = {
  data: AppData;
  updatedAt: string;
};

export type CloudBackup = {
  id: string;
  createdAt: string;
  sourceUpdatedAt: string;
};

export const starterData: AppData = {
  tasks: [{ id:"starter-review", title:"Review today’s priorities", date:today(), time:"09:00", category:"Personal", priority:"High", status:"open", recurrence:"Daily", reminderMinutes:15, createdAt:now() }],
  responsibilities: [
    { id:"resp-medicine", title:"Take transplant medicines on time", area:"Health", owner:"Abrar", frequency:"Daily", priority:"Critical", nextAction:"Add full medicine schedule", nextDate:today(), active:true, createdAt:now() },
    { id:"resp-debt", title:"Pay every minimum debt payment", area:"Money", owner:"Abrar", frequency:"Monthly", priority:"Critical", nextAction:"Add cards, loans and due dates", nextDate:today(), active:true, createdAt:now() },
    { id:"resp-immigration", title:"Maintain family immigration compliance", area:"Immigration", owner:"Abrar", frequency:"Monthly review", priority:"High", nextAction:"Add visa and passport expiry dates", nextDate:today(), active:true, createdAt:now() },
    { id:"resp-level7", title:"Complete Level 7 coursework", area:"Education", owner:"Abrar", frequency:"Weekly", priority:"High", nextAction:"Add current assignment deadline", nextDate:today(), active:true, createdAt:now() }
  ],
  brainDump: [],
  accounts: [],
  transactions: [],
  bills: [],
  debts: [],
  debtPayments: [],
  financeSettings: { nextPayday: "" }
};

function migrate(value: Partial<AppData>): AppData {
  const tasks: Task[] = (value.tasks ?? []).map((task) => ({ ...task, recurrence: task.recurrence ?? "None", reminderMinutes: task.reminderMinutes ?? 0 }));
  return {
    tasks,
    responsibilities: value.responsibilities ?? starterData.responsibilities,
    brainDump: value.brainDump ?? [],
    accounts: value.accounts ?? [],
    transactions: value.transactions ?? [],
    bills: value.bills ?? [],
    debts: value.debts ?? [],
    debtPayments: value.debtPayments ?? [],
    financeSettings: value.financeSettings ?? { nextPayday: "" }
  };
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function withRetry(operation: () => Promise<void>): Promise<void> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= CLOUD_SAVE_MAX_ATTEMPTS; attempt += 1) {
    try {
      await operation();
      return;
    } catch (error) {
      lastError = error;
      if (attempt < CLOUD_SAVE_MAX_ATTEMPTS) await sleep(400 * 2 ** (attempt - 1));
    }
  }
  throw lastError;
}

export function loadLocalSnapshot(): DataSnapshot {
  if (typeof window === "undefined") return { data: starterData, updatedAt: "" };
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    const updatedAt = window.localStorage.getItem(STORAGE_UPDATED_KEY) ?? "";
    return { data: value ? migrate(JSON.parse(value) as Partial<AppData>) : starterData, updatedAt };
  } catch {
    return { data: starterData, updatedAt: "" };
  }
}

export function loadData(): AppData {
  return loadLocalSnapshot().data;
}

export function saveLocalData(data: AppData, updatedAt = new Date().toISOString()): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  window.localStorage.setItem(STORAGE_UPDATED_KEY, updatedAt);
}

export async function loadCloudSnapshot(): Promise<DataSnapshot | null> {
  const user = auth?.currentUser;
  const firestore = db;
  if (!user || !firestore) return null;

  try {
    const snapshot = await getDoc(doc(firestore, "users", user.uid, "appData", "main"));
    if (!snapshot.exists()) return null;
    const raw = snapshot.data() as Partial<AppData> & { updatedAt?: string };
    return { data: migrate(raw), updatedAt: raw.updatedAt ?? "" };
  } catch (error) {
    console.error("Unable to load Abrar OS cloud data", error);
    return null;
  }
}

async function createDailyBackup(data: AppData, sourceUpdatedAt: string): Promise<void> {
  const user = auth?.currentUser;
  const firestore = db;
  if (!user || !firestore || typeof window === "undefined") return;

  const date = today();
  const markerKey = `${BACKUP_MARKER_PREFIX}-${user.uid}-${date}`;
  if (window.localStorage.getItem(markerKey)) return;

  const backupRef = doc(firestore, "users", user.uid, "backups", date);
  const existing = await getDoc(backupRef);
  if (!existing.exists()) {
    await setDoc(backupRef, {
      data,
      ownerUid: user.uid,
      createdAt: new Date().toISOString(),
      sourceUpdatedAt
    });
  }
  window.localStorage.setItem(markerKey, "created");
}

export async function saveCloudData(data: AppData, updatedAt = new Date().toISOString()): Promise<void> {
  const user = auth?.currentUser;
  const firestore = db;
  if (!user || !firestore) return;

  await withRetry(async () => {
    await setDoc(
      doc(firestore, "users", user.uid, "appData", "main"),
      { ...data, ownerUid: user.uid, updatedAt },
      { merge: true }
    );
  });

  await withRetry(() => createDailyBackup(data, updatedAt));
}

function isNewerSnapshot(candidate: DataSnapshot, existing: DataSnapshot | null): boolean {
  return !existing || candidate.updatedAt > existing.updatedAt;
}

function preserveFailedSave(snapshot: DataSnapshot): void {
  if (isNewerSnapshot(snapshot, pendingCloudSave)) pendingCloudSave = snapshot;
}

function enqueueLatestCloudSave(): void {
  const pending = pendingCloudSave;
  pendingCloudSave = null;
  cloudSaveTimer = null;
  if (!pending) return;

  cloudSaveQueue = cloudSaveQueue
    .catch(() => undefined)
    .then(() => saveCloudData(pending.data, pending.updatedAt))
    .catch((error) => {
      preserveFailedSave(pending);
      console.error("Unable to save Abrar OS cloud data after retries", error);
    });
}

export function flushPendingCloudSave(): void {
  if (cloudSaveTimer) {
    clearTimeout(cloudSaveTimer);
    cloudSaveTimer = null;
  }
  enqueueLatestCloudSave();
}

function installCloudSaveLifecycleListeners(): void {
  if (typeof window === "undefined" || lifecycleListenersInstalled) return;
  lifecycleListenersInstalled = true;

  window.addEventListener("online", flushPendingCloudSave);
  window.addEventListener("pagehide", flushPendingCloudSave);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushPendingCloudSave();
  });
}

function queueCloudSave(data: AppData, updatedAt: string): void {
  installCloudSaveLifecycleListeners();
  pendingCloudSave = { data, updatedAt };
  if (cloudSaveTimer) clearTimeout(cloudSaveTimer);
  cloudSaveTimer = setTimeout(enqueueLatestCloudSave, CLOUD_SAVE_DEBOUNCE_MS);
}

export async function listCloudBackups(): Promise<CloudBackup[]> {
  const user = auth?.currentUser;
  const firestore = db;
  if (!user || !firestore) return [];

  const snapshot = await getDocs(
    query(collection(firestore, "users", user.uid, "backups"), orderBy("createdAt", "desc"), limit(14))
  );

  return snapshot.docs.map((item) => {
    const value = item.data() as { createdAt?: string; sourceUpdatedAt?: string };
    return {
      id: item.id,
      createdAt: value.createdAt ?? item.id,
      sourceUpdatedAt: value.sourceUpdatedAt ?? ""
    };
  });
}

export async function restoreCloudBackup(backupId: string): Promise<AppData> {
  const user = auth?.currentUser;
  const firestore = db;
  if (!user || !firestore) throw new Error("Sign in before restoring a cloud backup.");

  const snapshot = await getDoc(doc(firestore, "users", user.uid, "backups", backupId));
  if (!snapshot.exists()) throw new Error("Backup not found.");

  const value = snapshot.data() as { data?: Partial<AppData> };
  if (!value.data) throw new Error("Backup data is invalid.");

  const restored = migrate(value.data);
  const restoredAt = new Date().toISOString();
  saveLocalData(restored, restoredAt);
  await saveCloudData(restored, restoredAt);
  return restored;
}

export function saveData(data: AppData): void {
  const updatedAt = new Date().toISOString();
  saveLocalData(data, updatedAt);
  queueCloudSave(data, updatedAt);
}

export function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function nextRecurringDate(date: string, recurrence: Task["recurrence"]): string {
  const next = new Date(`${date}T12:00:00`);
  if (recurrence === "Daily") next.setDate(next.getDate() + 1);
  if (recurrence === "Weekly") next.setDate(next.getDate() + 7);
  if (recurrence === "Monthly") next.setMonth(next.getMonth() + 1);
  if (recurrence === "Yearly") next.setFullYear(next.getFullYear() + 1);
  return next.toISOString().slice(0, 10);
}

export function advanceBillDate(date: string, frequency: Bill["frequency"]): string {
  const next = new Date(`${date}T12:00:00`);
  if (frequency === "Weekly") next.setDate(next.getDate() + 7);
  if (frequency === "Monthly") next.setMonth(next.getMonth() + 1);
  if (frequency === "Quarterly") next.setMonth(next.getMonth() + 3);
  if (frequency === "Yearly") next.setFullYear(next.getFullYear() + 1);
  return next.toISOString().slice(0, 10);
}
