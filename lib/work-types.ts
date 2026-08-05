export type WorkspaceName = "AAA Work" | "Embrace" | "Level 7";
export type WorkStatus = "Backlog" | "In progress" | "Waiting" | "Testing" | "Completed";
export type WorkPriority = "Low" | "Medium" | "High" | "Critical";

export type WorkItem = {
  id: string;
  workspace: WorkspaceName;
  title: string;
  description?: string;
  status: WorkStatus;
  priority: WorkPriority;
  dueDate?: string;
  owner: string;
  progress: number;
  createdAt: string;
  completedAt?: string;
};

export type WorkFollowUp = {
  id: string;
  workspace: WorkspaceName;
  person: string;
  subject: string;
  channel: "Phone" | "Email" | "WhatsApp" | "In person" | "Website";
  contactedDate?: string;
  nextDate: string;
  status: "Waiting" | "Replied" | "Closed";
  notes?: string;
  createdAt: string;
};

export type StudyUnit = {
  id: string;
  title: string;
  deadline?: string;
  wordTarget?: number;
  wordsDone?: number;
  status: "Not started" | "Researching" | "Drafting" | "Reviewing" | "Submitted" | "Completed";
  paymentDue?: number;
  notes?: string;
  createdAt: string;
};

export type WorkData = {
  items: WorkItem[];
  followUps: WorkFollowUp[];
  studyUnits: StudyUnit[];
};
