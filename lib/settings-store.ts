export type AppSettings = {
  displayName: string;
  pinHash: string;
  autoLockMinutes: number;
  dailyCalories: number;
  dailyProtein: number;
  currency: "GBP";
  lastBackupAt?: string;
};

export const SETTINGS_KEY = "abrar-os-settings-v1";
export const APP_DATA_KEYS = [
  "abrar-os-data-v1",
  "abrar-os-health-v1",
  "abrar-os-family-v1",
  "abrar-os-documents-v1",
  "abrar-os-cars-v1",
  "abrar-os-work-v1",
  "abrar-os-life-hub-v1",
];

export const defaultSettings: AppSettings = {
  displayName: "Abrar",
  pinHash: "",
  autoLockMinutes: 10,
  dailyCalories: 1800,
  dailyProtein: 120,
  currency: "GBP",
};

export function loadSettings(): AppSettings {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...defaultSettings, ...JSON.parse(raw) } : defaultSettings;
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: AppSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export async function hashPin(pin: string): Promise<string> {
  const bytes = new TextEncoder().encode(pin);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((value) => value.toString(16).padStart(2, "0")).join("");
}

export function exportAllData(): string {
  const payload: Record<string, unknown> = {
    version: 1,
    exportedAt: new Date().toISOString(),
  };
  [...APP_DATA_KEYS, SETTINGS_KEY].forEach((key) => {
    const raw = localStorage.getItem(key);
    if (raw) payload[key] = JSON.parse(raw);
  });
  return JSON.stringify(payload, null, 2);
}

export function importAllData(raw: string) {
  const payload = JSON.parse(raw) as Record<string, unknown>;
  [...APP_DATA_KEYS, SETTINGS_KEY].forEach((key) => {
    if (key in payload) localStorage.setItem(key, JSON.stringify(payload[key]));
  });
}

export function clearAllData() {
  [...APP_DATA_KEYS, SETTINGS_KEY].forEach((key) => localStorage.removeItem(key));
}
