import {
  makeCollectionRoutes,
  requireString,
  requireNumber,
} from "@/lib/crudHandlers";
import type { VitalEntry, VitalType } from "@/lib/types";

const DEFAULT_UNITS: Record<VitalType, string> = {
  weight: "kg",
  height: "cm",
  blood_pressure: "mmHg",
  heart_rate: "bpm",
  temperature: "°C",
  spo2: "%",
  steps: "passi",
  sleep_hours: "h",
  respiratory_rate: "atti/min",
  blood_glucose: "mg/dL",
  other: "",
};

function buildItem(body: any, id: string, now: string): VitalEntry {
  const type = requireString(body, "type") as VitalType;
  if (!(type in DEFAULT_UNITS)) {
    throw new Error(`Tipo di parametro non valido: ${type}`);
  }
  const date = requireString(body, "date");
  const value = requireNumber(body, "value");
  const value2 =
    body.value2 !== undefined && body.value2 !== null && body.value2 !== ""
      ? Number(body.value2)
      : undefined;

  return {
    id,
    type,
    date,
    value,
    value2: Number.isFinite(value2 as number) ? value2 : undefined,
    unit: typeof body.unit === "string" && body.unit ? body.unit : DEFAULT_UNITS[type],
    note: typeof body.note === "string" ? body.note : undefined,
    source: body.source === "google_fit_import" ? "google_fit_import" : "manual",
    createdAt: now,
  };
}

export const { GET, POST } = makeCollectionRoutes("vitals", buildItem);
