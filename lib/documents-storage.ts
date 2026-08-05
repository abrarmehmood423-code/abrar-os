import type { DocumentData } from "./documents-types";

const KEY = "abrar-os-documents-v1";
const now = () => new Date().toISOString();

export const starterDocuments: DocumentData = {
  documents: [],
  immigration: [
    {
      id: "immigration-abrar",
      person: "Abrar",
      route: "Skilled Worker – Health and Care",
      sponsor: "AAA Healthcare Agency Ltd",
      evisaChecked: false,
      createdAt: now(),
    },
    {
      id: "immigration-wife",
      person: "Wife",
      route: "Skilled Worker dependant",
      evisaChecked: false,
      createdAt: now(),
    },
  ],
};

export function loadDocumentData(): DocumentData {
  if (typeof window === "undefined") return starterDocuments;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return starterDocuments;
    const parsed = JSON.parse(raw) as Partial<DocumentData>;
    return {
      documents: parsed.documents ?? [],
      immigration: parsed.immigration ?? starterDocuments.immigration,
    };
  } catch {
    return starterDocuments;
  }
}

export function saveDocumentData(data: DocumentData) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function docId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
