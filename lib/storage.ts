import type { AppData } from "./types";

const STORAGE_KEY = "abrar-os-data-v1";

export const starterData: AppData = {
  tasks: [
    {
      id: "starter-review",
      title: "Review today’s priorities",
      date: new Date().toISOString().slice(0, 10),
      time: "09:00",
      category: "Personal",
      priority: "High",
      status: "open",
      createdAt: new Date().toISOString(),
    },
  ],
  brainDump: [],
};

export function loadData(): AppData {
  if (typeof window === "undefined") return starterData;

  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value ? (JSON.parse(value) as AppData) : starterData;
  } catch {
    return starterData;
  }
}

export function saveData(data: AppData): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
