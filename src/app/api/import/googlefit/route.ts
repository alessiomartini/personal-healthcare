import { NextRequest, NextResponse } from "next/server";
import { insertMany, newId } from "@/lib/db";
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

interface ColumnMapping {
  type: VitalType;
  column: string;
  unit?: string;
}

interface ImportRequestBody {
  headers: string[];
  rows: string[][];
  dateColumn: string;
  columns: ColumnMapping[];
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as ImportRequestBody | null;
  if (!body || !Array.isArray(body.rows) || !Array.isArray(body.headers) || !body.dateColumn) {
    return NextResponse.json({ error: "Richiesta non valida" }, { status: 400 });
  }
  const columns = Array.isArray(body.columns) ? body.columns.filter((c) => c.column) : [];
  if (columns.length === 0) {
    return NextResponse.json(
      { error: "Seleziona almeno una colonna da importare" },
      { status: 400 }
    );
  }

  const dateIdx = body.headers.indexOf(body.dateColumn);
  if (dateIdx === -1) {
    return NextResponse.json({ error: "Colonna data non trovata" }, { status: 400 });
  }
  const colIndexes = columns.map((c) => ({
    ...c,
    idx: body.headers.indexOf(c.column),
  }));

  const now = new Date().toISOString();
  const entries: VitalEntry[] = [];
  let skipped = 0;

  for (const row of body.rows) {
    const rawDate = row[dateIdx];
    const date = new Date(rawDate);
    if (!rawDate || Number.isNaN(date.getTime())) {
      skipped++;
      continue;
    }
    for (const col of colIndexes) {
      if (col.idx === -1) continue;
      const raw = row[col.idx];
      if (raw === undefined || raw === "") continue;
      const value = Number(raw);
      if (!Number.isFinite(value)) continue;
      entries.push({
        id: newId(),
        type: col.type,
        date: date.toISOString(),
        value,
        unit: col.unit || DEFAULT_UNITS[col.type],
        source: "google_fit_import",
        createdAt: now,
      });
    }
  }

  if (entries.length === 0) {
    return NextResponse.json(
      { error: "Nessun dato valido trovato con la mappatura scelta" },
      { status: 400 }
    );
  }

  await insertMany("vitals", entries);
  return NextResponse.json({ imported: entries.length, skippedRows: skipped });
}
