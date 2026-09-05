export type VitalType =
  | "weight"
  | "height"
  | "blood_pressure"
  | "heart_rate"
  | "temperature"
  | "spo2"
  | "steps"
  | "sleep_hours"
  | "respiratory_rate"
  | "blood_glucose"
  | "other";

export type VitalSource = "manual" | "google_fit_import";

export interface VitalEntry {
  id: string;
  type: VitalType;
  /** ISO datetime string */
  date: string;
  /** primary numeric value (weight kg, systolic mmHg, bpm, °C, %, steps, hours, breaths/min, mg/dL...) */
  value: number;
  /** secondary numeric value, used for blood_pressure diastolic */
  value2?: number;
  unit: string;
  note?: string;
  source: VitalSource;
  createdAt: string;
}

export type SymptomSeverity = 1 | 2 | 3 | 4 | 5;

export interface Symptom {
  id: string;
  date: string;
  name: string;
  severity: SymptomSeverity;
  possibleTriggers?: string;
  notes?: string;
  resolved: boolean;
  resolvedDate?: string;
  createdAt: string;
}

export interface Visit {
  id: string;
  date: string;
  doctorName?: string;
  specialty?: string;
  reason: string;
  outcome?: string;
  notes?: string;
  followUpDate?: string;
  createdAt: string;
}

export interface BloodTestResult {
  name: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  flag?: "low" | "normal" | "high";
}

export interface BloodTest {
  id: string;
  date: string;
  labName?: string;
  panelName: string;
  results: BloodTestResult[];
  notes?: string;
  createdAt: string;
}

export type NoteCategory = "idea" | "bug" | "feature_request" | "other";
export type NoteStatus = "open" | "done";

export interface Note {
  id: string;
  date: string;
  text: string;
  category: NoteCategory;
  status: NoteStatus;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface Database {
  vitals: VitalEntry[];
  symptoms: Symptom[];
  visits: Visit[];
  bloodTests: BloodTest[];
  notes: Note[];
  chats: ChatMessage[];
}

export type CollectionName = keyof Database;
