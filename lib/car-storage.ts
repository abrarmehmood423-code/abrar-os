import type { CarData } from "./car-types";

const KEY = "abrar-os-cars-v1";

export const starterCarData: CarData = {
  vehicles: [
    { id: "prius-2018", name: "Toyota Prius 2018", make: "Toyota", model: "Prius", year: 2018, fuelType: "Hybrid", notes: "Primary family vehicle." },
    { id: "corsa-2010", name: "Vauxhall Corsa 2010", make: "Vauxhall", model: "Corsa", year: 2010, fuelType: "Petrol", notes: "Second vehicle." },
  ],
  costs: [],
  parkingCases: [],
};

export function loadCarData(): CarData {
  if (typeof window === "undefined") return starterCarData;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...starterCarData, ...JSON.parse(raw) } : starterCarData;
  } catch {
    return starterCarData;
  }
}

export function saveCarData(data: CarData) {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(data));
}

export function carId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}
