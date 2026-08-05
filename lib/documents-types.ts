export type DocumentCategory =
  | "Passport"
  | "Visa / eVisa"
  | "Share code"
  | "Driving licence"
  | "DBS"
  | "Insurance"
  | "MOT / vehicle"
  | "Employment"
  | "Education"
  | "Health"
  | "Business"
  | "Family"
  | "Other";

export type RenewalStatus = "Active" | "Renew soon" | "Renewal started" | "Expired" | "Not applicable";

export type LifeDocument = {
  id: string;
  title: string;
  category: DocumentCategory;
  holder: string;
  reference?: string;
  issueDate?: string;
  expiryDate?: string;
  renewalStatus: RenewalStatus;
  renewalCost?: number;
  reminderDays: number[];
  notes?: string;
  createdAt: string;
};

export type ImmigrationRecord = {
  id: string;
  person: string;
  route: string;
  sponsor?: string;
  visaStart?: string;
  visaExpiry?: string;
  passportExpiry?: string;
  cosReference?: string;
  evisaChecked?: boolean;
  shareCodeLastGenerated?: string;
  notes?: string;
  createdAt: string;
};

export type DocumentData = {
  documents: LifeDocument[];
  immigration: ImmigrationRecord[];
};
