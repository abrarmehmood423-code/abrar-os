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

export type AccountType = "Current account" | "Cash" | "Savings" | "Credit card" | "Business" | "Pakistan account" | "Other";
export type Account = { id: string; name: string; type: AccountType; openingBalance: number; createdAt: string };
export type TransactionKind = "income" | "expense";
export type Transaction = { id: string; kind: TransactionKind; amount: number; date: string; category: string; description: string; accountId?: string; createdAt: string };
export type BillFrequency = "Weekly" | "Monthly" | "Quarterly" | "Yearly" | "One-time";
export type Bill = { id: string; provider: string; amount: number; dueDate: string; frequency: BillFrequency; paymentType: "Direct debit" | "Standing order" | "Manual bill" | "Subscription"; accountId?: string; variable: boolean; active: boolean; createdAt: string };
export type DebtStatus = "Accepted" | "Claimed / disputed" | "Informal" | "Paid off";
export type Debt = { id: string; lender: string; originalBalance: number; currentBalance: number; interestRate: number; minimumPayment: number; dueDate?: string; status: DebtStatus; notes?: string; createdAt: string };
export type DebtPayment = { id: string; debtId: string; amount: number; date: string; createdAt: string };
export type FinanceSettings = { nextPayday: string };

export type AppData = {
  tasks: Task[];
  responsibilities: Responsibility[];
  brainDump: BrainDump[];
  accounts: Account[];
  transactions: Transaction[];
  bills: Bill[];
  debts: Debt[];
  debtPayments: DebtPayment[];
  financeSettings: FinanceSettings;
};
