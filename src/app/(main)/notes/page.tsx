"use client";

import { useState } from "react";
import { useCollection } from "@/lib/useCollection";
import { formatDate } from "@/lib/format";
import type { Note, NoteCategory } from "@/lib/types";

const CATEGORY_LABELS: Record<NoteCategory, string> = {
  idea: "Idea",
  bug: "Problema/bug",
  feature_request: "Nuova funzione",
  other: "Altro",
};

export default function NotesPage() {
  const { items, loading, error, create, update, remove } = useCollection<Note>("/api/notes");
  const [text, setText] = useState("");
  const [category, setCategory] = useState<NoteCategory>("idea");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!text.trim()) {
      setFormError("Scrivi una nota");
      return;
    }
    setSubmitting(true);
    try {
      await create({ text, category });
      setText("");
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const open = items.filter((n) => n.status !== "done");
  const done = items.filter((n) => n.status === "done");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Note sul sito</h1>
        <p className="text-sm text-stone-500">
          Appunta idee, problemi o funzioni da aggiungere per migliorare questo sito.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-3">
        <div>
          <label className="label">Nota</label>
          <textarea
            className="input"
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="es. aggiungere grafico per la glicemia, il form visite è lento su mobile..."
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            className="input w-auto"
            value={category}
            onChange={(e) => setCategory(e.target.value as NoteCategory)}
          >
            {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Salvataggio..." : "Aggiungi nota"}
          </button>
          {formError && <span className="text-sm text-red-600">{formError}</span>}
        </div>
      </form>

      <div className="card">
        <h2 className="mb-3 font-medium">Da fare ({open.length})</h2>
        {loading ? (
          <p className="text-sm text-stone-500">Caricamento...</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : open.length === 0 ? (
          <p className="text-sm text-stone-500">Nessuna nota aperta.</p>
        ) : (
          <ul className="space-y-2">
            {open.map((n) => (
              <li key={n.id} className="flex items-start justify-between gap-3 rounded-lg border border-stone-100 p-3">
                <div>
                  <span className="mr-2 rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
                    {CATEGORY_LABELS[n.category]}
                  </span>
                  <span className="text-sm">{n.text}</span>
                  <p className="mt-1 text-xs text-stone-400">{formatDate(n.date)}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => update(n.id, { status: "done" })}
                    className="text-xs text-brand-700 hover:underline"
                  >
                    Fatto
                  </button>
                  <button
                    onClick={() => remove(n.id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Elimina
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {done.length > 0 && (
        <div className="card opacity-70">
          <h2 className="mb-3 font-medium">Completate ({done.length})</h2>
          <ul className="space-y-2">
            {done.map((n) => (
              <li key={n.id} className="flex items-start justify-between gap-3 text-sm">
                <span className="line-through">{n.text}</span>
                <button
                  onClick={() => remove(n.id)}
                  className="text-xs text-red-600 hover:underline"
                >
                  Elimina
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
