"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useCollection } from "@/lib/useCollection";
import { formatDateTime, todayInputValue } from "@/lib/format";
import type { VitalEntry, VitalType } from "@/lib/types";

const TYPE_LABELS: Record<VitalType, string> = {
  weight: "Peso",
  height: "Altezza",
  blood_pressure: "Pressione arteriosa",
  heart_rate: "Frequenza cardiaca",
  temperature: "Temperatura corporea",
  spo2: "Saturazione O2 (SpO2)",
  steps: "Passi",
  sleep_hours: "Ore di sonno",
  respiratory_rate: "Frequenza respiratoria",
  blood_glucose: "Glicemia",
  other: "Altro",
};

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

const TYPE_OPTIONS = Object.keys(TYPE_LABELS) as VitalType[];

export default function VitalsPage() {
  const { items, loading, error, create, remove } = useCollection<VitalEntry>("/api/vitals");
  const [type, setType] = useState<VitalType>("weight");
  const [date, setDate] = useState(`${todayInputValue()}T08:00`);
  const [value, setValue] = useState("");
  const [value2, setValue2] = useState("");
  const [note, setNote] = useState("");
  const [filter, setFilter] = useState<VitalType | "all">("all");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const filtered = useMemo(
    () => (filter === "all" ? items : items.filter((i) => i.type === filter)),
    [items, filter]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!value) {
      setFormError("Inserisci un valore");
      return;
    }
    setSubmitting(true);
    try {
      await create({
        type,
        date: new Date(date).toISOString(),
        value: Number(value),
        value2: type === "blood_pressure" && value2 ? Number(value2) : undefined,
        unit: DEFAULT_UNITS[type],
        note: note || undefined,
      });
      setValue("");
      setValue2("");
      setNote("");
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">Parametri vitali</h1>
          <p className="text-sm text-stone-500">
            Peso, altezza, pressione, battito e altri dati (anche importati da Google Fit).
          </p>
        </div>
        <Link href="/vitals/import" className="btn-secondary text-xs">
          Importa da Google Fit (CSV)
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="card grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <div className="lg:col-span-2">
          <label className="label">Tipo</label>
          <select
            className="input"
            value={type}
            onChange={(e) => setType(e.target.value as VitalType)}
          >
            {TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div className="lg:col-span-2">
          <label className="label">Data e ora</label>
          <input
            type="datetime-local"
            className="input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">
            {type === "blood_pressure" ? "Sistolica" : "Valore"} ({DEFAULT_UNITS[type] || "-"})
          </label>
          <input
            type="number"
            step="any"
            className="input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            required
          />
        </div>
        {type === "blood_pressure" && (
          <div>
            <label className="label">Diastolica (mmHg)</label>
            <input
              type="number"
              step="any"
              className="input"
              value={value2}
              onChange={(e) => setValue2(e.target.value)}
            />
          </div>
        )}
        <div className={type === "blood_pressure" ? "lg:col-span-6" : "lg:col-span-3"}>
          <label className="label">Nota (opzionale)</label>
          <input
            type="text"
            className="input"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="es. a digiuno, dopo attività fisica..."
          />
        </div>
        <div className="lg:col-span-6 flex items-center gap-3">
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Salvataggio..." : "Aggiungi misurazione"}
          </button>
          {formError && <span className="text-sm text-red-600">{formError}</span>}
        </div>
      </form>

      <div className="card">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-medium">Storico</h2>
          <select
            className="input w-auto"
            value={filter}
            onChange={(e) => setFilter(e.target.value as VitalType | "all")}
          >
            <option value="all">Tutti i tipi</option>
            {TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        {loading ? (
          <p className="text-sm text-stone-500">Caricamento...</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-stone-500">Nessuna misurazione registrata.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Tipo</th>
                  <th>Valore</th>
                  <th>Nota</th>
                  <th>Origine</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => (
                  <tr key={v.id}>
                    <td>{formatDateTime(v.date)}</td>
                    <td>{TYPE_LABELS[v.type]}</td>
                    <td>
                      {v.type === "blood_pressure" && v.value2 !== undefined
                        ? `${v.value}/${v.value2} ${v.unit}`
                        : `${v.value} ${v.unit}`}
                    </td>
                    <td className="text-stone-500">{v.note || "-"}</td>
                    <td className="text-stone-500">
                      {v.source === "google_fit_import" ? "Google Fit" : "Manuale"}
                    </td>
                    <td>
                      <button
                        onClick={() => remove(v.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Elimina
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
