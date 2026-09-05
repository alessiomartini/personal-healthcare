"use client";

import { useState } from "react";
import { useCollection } from "@/lib/useCollection";
import { formatDate, todayInputValue } from "@/lib/format";
import type { Symptom } from "@/lib/types";

const SEVERITY_LABELS: Record<number, string> = {
  1: "Molto lieve",
  2: "Lieve",
  3: "Moderato",
  4: "Forte",
  5: "Molto forte",
};

export default function SymptomsPage() {
  const { items, loading, error, create, update, remove } =
    useCollection<Symptom>("/api/symptoms");
  const [date, setDate] = useState(todayInputValue());
  const [name, setName] = useState("");
  const [severity, setSeverity] = useState(3);
  const [possibleTriggers, setPossibleTriggers] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!name.trim()) {
      setFormError("Descrivi il sintomo");
      return;
    }
    setSubmitting(true);
    try {
      await create({
        date: new Date(date).toISOString(),
        name,
        severity,
        possibleTriggers: possibleTriggers || undefined,
        notes: notes || undefined,
        resolved: false,
      });
      setName("");
      setPossibleTriggers("");
      setNotes("");
      setSeverity(3);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Sintomi</h1>
        <p className="text-sm text-stone-500">
          Registra i sintomi non appena si presentano: sarà più facile individuare pattern
          e discuterne con l&apos;assistente AI o con il medico.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
        <div className="lg:col-span-2">
          <label className="label">Sintomo</label>
          <input
            type="text"
            className="input"
            placeholder="es. mal di testa, tosse, dolore addominale..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">Intensità</label>
          <select
            className="input"
            value={severity}
            onChange={(e) => setSeverity(Number(e.target.value))}
          >
            {[1, 2, 3, 4, 5].map((s) => (
              <option key={s} value={s}>
                {s} - {SEVERITY_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="lg:col-span-2">
          <label className="label">Possibili cause/fattori scatenanti</label>
          <input
            type="text"
            className="input"
            placeholder="es. freddo, alcol, schermi, stress..."
            value={possibleTriggers}
            onChange={(e) => setPossibleTriggers(e.target.value)}
          />
        </div>
        <div className="lg:col-span-2">
          <label className="label">Note</label>
          <input
            type="text"
            className="input"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <div className="lg:col-span-4 flex items-center gap-3">
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Salvataggio..." : "Aggiungi sintomo"}
          </button>
          {formError && <span className="text-sm text-red-600">{formError}</span>}
        </div>
      </form>

      <div className="card">
        <h2 className="mb-3 font-medium">Storico sintomi</h2>
        {loading ? (
          <p className="text-sm text-stone-500">Caricamento...</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-stone-500">Nessun sintomo registrato.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Sintomo</th>
                  <th>Intensità</th>
                  <th>Cause possibili</th>
                  <th>Stato</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((s) => (
                  <tr key={s.id}>
                    <td>{formatDate(s.date)}</td>
                    <td>
                      {s.name}
                      {s.notes && <div className="text-xs text-stone-400">{s.notes}</div>}
                    </td>
                    <td>{SEVERITY_LABELS[s.severity]}</td>
                    <td className="text-stone-500">{s.possibleTriggers || "-"}</td>
                    <td>
                      <button
                        onClick={() =>
                          update(s.id, {
                            resolved: !s.resolved,
                            resolvedDate: !s.resolved
                              ? new Date().toISOString()
                              : undefined,
                          })
                        }
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          s.resolved
                            ? "bg-brand-100 text-brand-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {s.resolved ? "Risolto" : "In corso"}
                      </button>
                    </td>
                    <td>
                      <button
                        onClick={() => remove(s.id)}
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
