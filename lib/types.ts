export type Priority = "Low" | "Medium" | "High" | "Critical";
export type TaskStatus = "open" | "done";

export type Task = {
  id: string;
  title: string;
  date: string;
  time?: string;
  category: string;
  priority: Priority;
  status: TaskStatus;
  notes?: string;
  createdAt: string;
  completedAt?: string;
};

export type BrainDump = {
  id: string;
  text: string;
  createdAt: string;
};

export type AppData = {
  tasks: Task[];
  brainDump: BrainDump[];
};
