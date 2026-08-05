export type Priority = "Low" | "Medium" | "High" | "Critical";
export type TaskStatus = "open" | "done";
export type Recurrence = "None" | "Daily" | "Weekly" | "Monthly" | "Yearly";

export type Task = {
  id: string;
  title: string;
  date: string;
  time?: string;
  category: string;
  priority: Priority;
  status: TaskStatus;
  recurrence: Recurrence;
  reminderMinutes?: number;
  notes?: string;
  createdAt: string;
  completedAt?: string;
};

export type Responsibility = {
  id: string;
  title: string;
  area: string;
  owner: string;
  frequency: string;
  priority: Priority;
  nextAction: string;
  nextDate: string;
  active: boolean;
  createdAt: string;
};

export type BrainDump = {
  id: string;
  text: string;
  createdAt: string;
};

export type AppData = {
  tasks: Task[];
  responsibilities: Responsibility[];
  brainDump: BrainDump[];
};
