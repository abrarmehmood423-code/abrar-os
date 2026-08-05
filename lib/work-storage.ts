import type { WorkData } from "./work-types";

const KEY = "abrar-os-work-v1";
const now = () => new Date().toISOString();

export const starterWorkData: WorkData = {
  items: [
    {
      id: "aaa-hours",
      workspace: "AAA Work",
      title: "Track agreed working hours and employer requests",
      description: "Keep a dated private record of hours, requests, concerns and supporting evidence.",
      status: "Backlog",
      priority: "Critical",
      owner: "Abrar",
      progress: 0,
      createdAt: now(),
    },
    {
      id: "embrace-audit",
      workspace: "Embrace",
      title: "Maintain website and portal correction list",
      description: "Record every requested fix, developer response, testing result and completion date.",
      status: "In progress",
      priority: "High",
      owner: "Abrar",
      progress: 25,
      createdAt: now(),
    },
  ],
  followUps: [],
  studyUnits: [
    {
      id: "level7-current",
      title: "Current Level 7 unit",
      status: "Not started",
      wordTarget: 0,
      wordsDone: 0,
      createdAt: now(),
    },
  ],
};

export function loadWorkData(): WorkData {
  if (typeof window === "undefined") return starterWorkData;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return starterWorkData;
    const parsed = JSON.parse(raw) as Partial<WorkData>;
    return {
      items: parsed.items ?? starterWorkData.items,
      followUps: parsed.followUps ?? [],
      studyUnits: parsed.studyUnits ?? starterWorkData.studyUnits,
    };
  } catch {
    return starterWorkData;
  }
}

export function saveWorkData(data: WorkData) {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(data));
}

export function workId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
