"use client";

import { useState } from "react";
import { useCollection } from "@/lib/useCollection";
import { formatDate, todayInputValue } from "@/lib/format";
import type { Visit } from "@/lib/types";

export default function VisitsPage() {
  const { items, loading, error, create, remove } = useCollection<Visit>("/api/visits");
  const [date, setDate] = useState(todayInputValue());
  const [doctorName, setDoctorName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [reason, setReason] = useState("");
  const [outcome, setOutcome] = useState("");
  const [notes, setNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!reason.trim()) {
      setFormError("Indica il motivo della visita");
      return;
    }
    setSubmitting(true);
    try {
      await create({
        date: new Date(date).toISOString(),
        doctorName: doctorName || undefined,
        specialty: specialty || undefined,
        reason,
        outcome: outcome || undefined,
        notes: notes || undefined,
        followUpDate: followUpDate ? new Date(followUpDate).toISOString() : undefined,
      });
      setDoctorName("");
      setSpecialty("");
      setReason("");
      setOutcome("");
      setNotes("");
      setFollowUpDate("");
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Visite mediche</h1>
        <p className="text-sm text-stone-500">Tieni traccia di visite, specialisti ed esiti.</p>
      </div>

      <form onSubmit={handleSubmit} className="card grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          <label className="label">Medico</label>
          <input
            type="text"
            className="input"
            value={doctorName}
            onChange={(e) => setDoctorName(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Specializzazione</label>
          <input
            type="text"
            className="input"
            placeholder="es. cardiologo, dermatologo..."
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
          />
        </div>
        <div className="lg:col-span-3">
          <label className="label">Motivo della visita</label>
          <input
            type="text"
            className="input"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />
        </div>
        <div className="lg:col-span-2">
          <label className="label">Esito / diagnosi</label>
          <input
            type="text"
            className="input"
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Prossimo controllo</label>
          <input
            type="date"
            className="input"
            value={followUpDate}
            onChange={(e) => setFollowUpDate(e.target.value)}
          />
        </div>
        <div className="lg:col-span-3">
          <label className="label">Note</label>
          <textarea
            className="input"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <div className="lg:col-span-3 flex items-center gap-3">
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Salvataggio..." : "Aggiungi visita"}
          </button>
          {formError && <span className="text-sm text-red-600">{formError}</span>}
        </div>
      </form>

      <div className="card">
        <h2 className="mb-3 font-medium">Storico visite</h2>
        {loading ? (
          <p className="text-sm text-stone-500">Caricamento...</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-stone-500">Nessuna visita registrata.</p>
        ) : (
          <div className="space-y-3">
            {items.map((v) => (
              <div key={v.id} className="rounded-lg border border-stone-100 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">
                      {v.reason}{" "}
                      {v.specialty && (
                        <span className="text-xs font-normal text-stone-400">
                          ({v.specialty})
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-stone-500">
                      {formatDate(v.date)}
                      {v.doctorName ? ` · ${v.doctorName}` : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => remove(v.id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Elimina
                  </button>
                </div>
                {v.outcome && <p className="mt-2 text-sm">Esito: {v.outcome}</p>}
                {v.notes && <p className="mt-1 text-sm text-stone-500">{v.notes}</p>}
                {v.followUpDate && (
                  <p className="mt-1 text-xs text-brand-700">
                    Prossimo controllo: {formatDate(v.followUpDate)}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
