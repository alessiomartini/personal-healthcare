"use client";

import { useState } from "react";
import Link from "next/link";
import { parseCSV } from "@/lib/csv";
import type { VitalType } from "@/lib/types";

const TYPE_LABELS: Record<VitalType, string> = {
  weight: "Peso",
  height: "Altezza",
  blood_pressure: "Pressione arteriosa (solo sistolica)",
  heart_rate: "Frequenza cardiaca",
  temperature: "Temperatura corporea",
  spo2: "Saturazione O2 (SpO2)",
  steps: "Passi",
  sleep_hours: "Ore di sonno",
  respiratory_rate: "Frequenza respiratoria",
  blood_glucose: "Glicemia",
  other: "Altro",
};

interface ColumnMapping {
  type: VitalType;
  column: string;
}

export default function ImportGoogleFitPage() {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [fileName, setFileName] = useState("");
  const [dateColumn, setDateColumn] = useState("");
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ imported: number; skippedRows: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    setError(null);
    const text = await file.text();
    const parsed = parseCSV(text);
    setHeaders(parsed.headers);
    setRows(parsed.rows);
    setDateColumn(
      parsed.headers.find((h) => /date|time|giorno|data/i.test(h)) || parsed.headers[0] || ""
    );
    setMappings([]);
  }

  function addMapping() {
    setMappings((m) => [...m, { type: "weight", column: headers[0] || "" }]);
  }

  function updateMapping(idx: number, patch: Partial<ColumnMapping>) {
    setMappings((m) => m.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  }

  function removeMapping(idx: number) {
    setMappings((m) => m.filter((_, i) => i !== idx));
  }

  async function handleImport() {
    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/import/googlefit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ headers, rows, dateColumn, columns: mappings }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore durante l'importazione");
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Importa da Google Fit</h1>
        <p className="text-sm text-stone-500">
          Esporta i tuoi dati da{" "}
          <a
            href="https://takeout.google.com/"
            target="_blank"
            rel="noreferrer"
            className="text-brand-700 underline"
          >
            Google Takeout
          </a>{" "}
          (sezione &quot;Fit&quot;) oppure da un&apos;app terza che esporta CSV, poi carica qui il
          file. Puoi scegliere quale colonna corrisponde alla data e quali colonne importare come
          parametri vitali.
        </p>
      </div>

      <div className="card space-y-4">
        <div>
          <label className="label">File CSV</label>
          <input type="file" accept=".csv,text/csv" onChange={handleFile} />
          {fileName && (
            <p className="mt-1 text-xs text-stone-500">
              {fileName} · {rows.length} righe, {headers.length} colonne rilevate
            </p>
          )}
        </div>

        {headers.length > 0 && (
          <>
            <div>
              <label className="label">Colonna data/ora</label>
              <select
                className="input"
                value={dateColumn}
                onChange={(e) => setDateColumn(e.target.value)}
              >
                {headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Colonne da importare</label>
              <div className="space-y-2">
                {mappings.map((m, idx) => (
                  <div key={idx} className="flex flex-wrap gap-2">
                    <select
                      className="input w-auto"
                      value={m.type}
                      onChange={(e) => updateMapping(idx, { type: e.target.value as VitalType })}
                    >
                      {Object.entries(TYPE_LABELS).map(([k, label]) => (
                        <option key={k} value={k}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <select
                      className="input w-auto"
                      value={m.column}
                      onChange={(e) => updateMapping(idx, { column: e.target.value })}
                    >
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => removeMapping(idx)}
                      className="text-xs text-red-600"
                    >
                      Rimuovi
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={addMapping} className="btn-secondary mt-2 text-xs">
                + Aggiungi colonna
              </button>
            </div>

            <button
              onClick={handleImport}
              className="btn-primary"
              disabled={submitting || mappings.length === 0}
            >
              {submitting ? "Importazione..." : "Importa dati"}
            </button>
          </>
        )}

        {result && (
          <p className="text-sm text-brand-700">
            Importate {result.imported} misurazioni
            {result.skippedRows > 0 ? ` (${result.skippedRows} righe saltate per data non valida)` : ""}.{" "}
            <Link href="/vitals" className="underline">
              Vai allo storico
            </Link>
          </p>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
