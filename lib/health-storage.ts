import type { HealthData } from "./health-types";

const KEY = "abrar-os-health-v1";

export const starterHealthData: HealthData = {
  medicines: [],
  medicineLogs: [],
  food: [],
  measurements: [],
  settings: { calorieTarget: 1800, proteinTarget: 120, waterTargetMl: 2500 },
};

export function loadHealthData(): HealthData {
  if (typeof window === "undefined") return starterHealthData;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return starterHealthData;
    const value = JSON.parse(raw) as Partial<HealthData>;
    return {
      medicines: value.medicines ?? [],
      medicineLogs: value.medicineLogs ?? [],
      food: value.food ?? [],
      measurements: value.measurements ?? [],
      settings: value.settings ?? starterHealthData.settings,
    };
  } catch {
    return starterHealthData;
  }
}

export function saveHealthData(data: HealthData) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(data));
}

export function healthId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
