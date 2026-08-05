export type Medicine = {
  id: string;
  name: string;
  dose: string;
  scheduledTimes: string[];
  instructions?: string;
  stock: number;
  refillDate?: string;
  active: boolean;
  createdAt: string;
};

export type MedicineLog = {
  id: string;
  medicineId: string;
  date: string;
  scheduledTime: string;
  takenTime?: string;
  status: "taken" | "missed" | "skipped";
  createdAt: string;
};

export type FoodEntry = {
  id: string;
  date: string;
  time: string;
  name: string;
  quantity?: string;
  calories: number;
  protein: number;
  carbs: number;
  sugar: number;
  notes?: string;
  createdAt: string;
};

export type HealthMeasurement = {
  id: string;
  date: string;
  weight?: number;
  waist?: number;
  hba1c?: number;
  waterMl?: number;
  cigarettes?: number;
  notes?: string;
  createdAt: string;
};

export type HealthSettings = {
  calorieTarget: number;
  proteinTarget: number;
  waterTargetMl: number;
};

export type HealthData = {
  medicines: Medicine[];
  medicineLogs: MedicineLog[];
  food: FoodEntry[];
  measurements: HealthMeasurement[];
  settings: HealthSettings;
};
