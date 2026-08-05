export type FamilyMember = {
  id: string;
  name: string;
  relationship: string;
  dateOfBirth?: string;
  location?: string;
  phone?: string;
  notes?: string;
  createdAt: string;
};

export type FamilyEvent = {
  id: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  people: string;
  estimatedCost: number;
  preparation?: string;
  createdAt: string;
};

export type FamilyAppointment = {
  id: string;
  person: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  category: "GP" | "Hospital" | "Nursery" | "School" | "Driving" | "Immigration" | "Other";
  notes?: string;
  completed: boolean;
  createdAt: string;
};

export type HouseholdResponsibility = {
  id: string;
  title: string;
  owner: "Abrar" | "Wife" | "Shared" | string;
  area: "Children" | "Home" | "Parents" | "Transport" | "Health" | "Money" | "Other";
  frequency: string;
  nextDate: string;
  notes?: string;
  completed: boolean;
  createdAt: string;
};

export type FamilySupport = {
  id: string;
  person: string;
  country: string;
  amount: number;
  date: string;
  purpose?: string;
  createdAt: string;
};

export type FamilyData = {
  members: FamilyMember[];
  events: FamilyEvent[];
  appointments: FamilyAppointment[];
  responsibilities: HouseholdResponsibility[];
  supportPayments: FamilySupport[];
};
