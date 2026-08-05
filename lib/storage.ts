import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import type { AppData, Bill, Task } from "./types";

const STORAGE_KEY = "abrar-os-data-v1";
const today = () => new Date().toISOString().slice(0, 10);
const now = () => new Date().toISOString();

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

export function loadData(): AppData {
  if (typeof window === "undefined") return starterData;
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value ? migrate(JSON.parse(value) as Partial<AppData>) : starterData;
  } catch {
    return starterData;
  }
}

export async function loadCloudData(): Promise<AppData | null> {
  const user = auth?.currentUser;
  if (!user || !db) return null;

  try {
    const snapshot = await getDoc(doc(db, "users", user.uid, "appData", "main"));
    if (!snapshot.exists()) return null;
    return migrate(snapshot.data() as Partial<AppData>);
  } catch (error) {
    console.error("Unable to load Abrar OS cloud data", error);
    return null;
  }
}

export function saveData(data: AppData): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  const user = auth?.currentUser;
  if (!user || !db) return;

  void setDoc(
    doc(db, "users", user.uid, "appData", "main"),
    {
      ...data,
      ownerUid: user.uid,
      updatedAt: new Date().toISOString()
    },
    { merge: true }
  ).catch((error) => {
    console.error("Unable to save Abrar OS cloud data", error);
  });
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
