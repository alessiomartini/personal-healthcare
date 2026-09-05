"use client";

import { useState } from "react";
import { useCollection } from "@/lib/useCollection";
import { formatDate, todayInputValue } from "@/lib/format";
import type { BloodTest, BloodTestResult } from "@/lib/types";

const EMPTY_ROW: BloodTestResult = { name: "", value: "", unit: "", referenceRange: "", flag: undefined };

const FLAG_LABEL: Record<string, string> = {
  low: "Basso",
  normal: "Normale",
  high: "Alto",
};

export default function BloodTestsPage() {
  const { items, loading, error, create, remove } = useCollection<BloodTest>("/api/bloodtests");
  const [date, setDate] = useState(todayInputValue());
  const [labName, setLabName] = useState("");
  const [panelName, setPanelName] = useState("");
  const [notes, setNotes] = useState("");
  const [results, setResults] = useState<BloodTestResult[]>([{ ...EMPTY_ROW }]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function updateRow(idx: number, patch: Partial<BloodTestResult>) {
    setResults((rows) => rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setResults((rows) => [...rows, { ...EMPTY_ROW }]);
  }

  function removeRow(idx: number) {
    setResults((rows) => rows.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!panelName.trim()) {
      setFormError("Indica il nome del pannello/esame");
      return;
    }
    setSubmitting(true);
    try {
      await create({
        date: new Date(date).toISOString(),
        labName: labName || undefined,
        panelName,
        notes: notes || undefined,
        results: results.filter((r) => r.name.trim()),
      });
      setLabName("");
      setPanelName("");
      setNotes("");
      setResults([{ ...EMPTY_ROW }]);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Esami del sangue</h1>
        <p className="text-sm text-stone-500">
          Registra pannelli di analisi e i singoli valori, con i range di riferimento.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="label">Data</label>
            <input
              type="date"
              className="input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Nome pannello/esame</label>
            <input
              type="text"
              className="input"
              placeholder="es. Emocromo completo"
              value={panelName}
              onChange={(e) => setPanelName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Laboratorio</label>
            <input
              type="text"
              className="input"
              value={labName}
              onChange={(e) => setLabName(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="label">Risultati</label>
          <div className="space-y-2">
            {results.map((row, idx) => (
              <div key={idx} className="grid grid-cols-2 gap-2 sm:grid-cols-6">
                <input
                  className="input sm:col-span-2"
                  placeholder="Nome (es. Glicemia)"
                  value={row.name}
                  onChange={(e) => updateRow(idx, { name: e.target.value })}
                />
                <input
                  className="input"
                  placeholder="Valore"
                  value={row.value}
                  onChange={(e) => updateRow(idx, { value: e.target.value })}
                />
                <input
                  className="input"
                  placeholder="Unità"
                  value={row.unit}
                  onChange={(e) => updateRow(idx, { unit: e.target.value })}
                />
                <input
                  className="input"
                  placeholder="Range rif."
                  value={row.referenceRange}
                  onChange={(e) => updateRow(idx, { referenceRange: e.target.value })}
                />
                <div className="flex gap-1">
                  <select
                    className="input"
                    value={row.flag || ""}
                    onChange={(e) =>
                      updateRow(idx, { flag: (e.target.value || undefined) as any })
                    }
                  >
                    <option value="">-</option>
                    <option value="low">Basso</option>
                    <option value="normal">Normale</option>
                    <option value="high">Alto</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => removeRow(idx)}
                    className="text-xs text-red-600"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={addRow} className="btn-secondary mt-2 text-xs">
            + Aggiungi valore
          </button>
        </div>

        <div>
          <label className="label">Note</label>
          <textarea
            className="input"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Salvataggio..." : "Salva esame"}
          </button>
          {formError && <span className="text-sm text-red-600">{formError}</span>}
        </div>
      </form>

      <div className="card">
        <h2 className="mb-3 font-medium">Storico esami</h2>
        {loading ? (
          <p className="text-sm text-stone-500">Caricamento...</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-stone-500">Nessun esame registrato.</p>
        ) : (
          <div className="space-y-4">
            {items.map((bt) => (
              <div key={bt.id} className="rounded-lg border border-stone-100 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{bt.panelName}</p>
                    <p className="text-xs text-stone-500">
                      {formatDate(bt.date)}
                      {bt.labName ? ` · ${bt.labName}` : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => remove(bt.id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Elimina
                  </button>
                </div>
                {bt.results.length > 0 && (
                  <div className="mt-2 overflow-x-auto">
                    <table className="table-base">
                      <thead>
                        <tr>
                          <th>Parametro</th>
                          <th>Valore</th>
                          <th>Range</th>
                          <th>Esito</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bt.results.map((r, i) => (
                          <tr key={i}>
                            <td>{r.name}</td>
                            <td>
                              {r.value} {r.unit}
                            </td>
                            <td className="text-stone-500">{r.referenceRange || "-"}</td>
                            <td>
                              {r.flag ? (
                                <span
                                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                    r.flag === "normal"
                                      ? "bg-brand-100 text-brand-800"
                                      : "bg-amber-100 text-amber-800"
                                  }`}
                                >
                                  {FLAG_LABEL[r.flag]}
                                </span>
                              ) : (
                                "-"
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {bt.notes && <p className="mt-2 text-sm text-stone-500">{bt.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
