import type { FamilyData } from "./family-types";

const KEY = "abrar-os-family-v1";
const now = () => new Date().toISOString();

export const starterFamilyData: FamilyData = {
  members: [
    { id: "family-abrar", name: "Abrar", relationship: "Self", location: "United Kingdom", createdAt: now() },
    { id: "family-wife", name: "Wife", relationship: "Spouse", location: "United Kingdom", notes: "Driving and English-learning support", createdAt: now() },
    { id: "family-child-1", name: "Child 1", relationship: "Child", location: "United Kingdom", createdAt: now() },
    { id: "family-child-2", name: "Child 2", relationship: "Child", location: "United Kingdom", createdAt: now() },
    { id: "family-parents", name: "Parents", relationship: "Parents", location: "Pakistan", notes: "Regular calls and financial support", createdAt: now() },
  ],
  events: [],
  appointments: [],
  responsibilities: [
    { id: "family-nursery", title: "Review nursery dates and charges", owner: "Shared", area: "Children", frequency: "Weekly", nextDate: new Date().toISOString().slice(0,10), completed: false, createdAt: now() },
    { id: "family-wife-driving", title: "Support wife with UK driving progress", owner: "Abrar", area: "Transport", frequency: "Weekly", nextDate: new Date().toISOString().slice(0,10), completed: false, createdAt: now() },
    { id: "family-parents-call", title: "Call parents in Pakistan", owner: "Abrar", area: "Parents", frequency: "Weekly", nextDate: new Date().toISOString().slice(0,10), completed: false, createdAt: now() },
  ],
  supportPayments: [],
};

export function loadFamilyData(): FamilyData {
  if (typeof window === "undefined") return starterFamilyData;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return starterFamilyData;
    const value = JSON.parse(raw) as Partial<FamilyData>;
    return {
      members: value.members ?? starterFamilyData.members,
      events: value.events ?? [],
      appointments: value.appointments ?? [],
      responsibilities: value.responsibilities ?? starterFamilyData.responsibilities,
      supportPayments: value.supportPayments ?? [],
    };
  } catch {
    return starterFamilyData;
  }
}

export function saveFamilyData(data: FamilyData) {
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, JSON.stringify(data));
}

export function familyId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
