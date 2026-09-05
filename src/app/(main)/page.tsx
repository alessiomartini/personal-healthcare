"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useCollection } from "@/lib/useCollection";
import { formatDate } from "@/lib/format";
import VitalTrendChart from "@/components/VitalTrendChart";
import type { Symptom, Visit, VitalEntry } from "@/lib/types";

function latestOf(vitals: VitalEntry[], type: VitalEntry["type"]): VitalEntry | undefined {
  return [...vitals]
    .filter((v) => v.type === type)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
}

export default function DashboardPage() {
  const { items: vitals, loading: loadingVitals } = useCollection<VitalEntry>("/api/vitals");
  const { items: symptoms, loading: loadingSymptoms } = useCollection<Symptom>("/api/symptoms");
  const { items: visits, loading: loadingVisits } = useCollection<Visit>("/api/visits");

  const latestWeight = useMemo(() => latestOf(vitals, "weight"), [vitals]);
  const latestBp = useMemo(() => latestOf(vitals, "blood_pressure"), [vitals]);
  const latestHr = useMemo(() => latestOf(vitals, "heart_rate"), [vitals]);
  const latestTemp = useMemo(() => latestOf(vitals, "temperature"), [vitals]);

  const activeSymptoms = useMemo(
    () => symptoms.filter((s) => !s.resolved).sort((a, b) => b.date.localeCompare(a.date)),
    [symptoms]
  );

  const upcomingVisits = useMemo(
    () =>
      visits
        .filter((v) => v.followUpDate && new Date(v.followUpDate) >= new Date(new Date().toDateString()))
        .sort((a, b) => (a.followUpDate || "").localeCompare(b.followUpDate || "")),
    [visits]
  );

  const loading = loadingVitals || loadingSymptoms || loadingVisits;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-stone-500">Panoramica dei tuoi dati sanitari.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Peso"
          value={latestWeight ? `${latestWeight.value} ${latestWeight.unit}` : "-"}
          date={latestWeight?.date}
        />
        <StatCard
          label="Pressione"
          value={
            latestBp
              ? `${latestBp.value}${latestBp.value2 ? "/" + latestBp.value2 : ""} ${latestBp.unit}`
              : "-"
          }
          date={latestBp?.date}
        />
        <StatCard
          label="Battito"
          value={latestHr ? `${latestHr.value} ${latestHr.unit}` : "-"}
          date={latestHr?.date}
        />
        <StatCard
          label="Temperatura"
          value={latestTemp ? `${latestTemp.value} ${latestTemp.unit}` : "-"}
          date={latestTemp?.date}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <VitalTrendChart
          title="Peso"
          unit="kg"
          data={vitals.filter((v) => v.type === "weight")}
        />
        <VitalTrendChart
          title="Pressione arteriosa"
          unit="mmHg"
          secondaryLabel="Diastolica"
          data={vitals.filter((v) => v.type === "blood_pressure")}
        />
        <VitalTrendChart
          title="Frequenza cardiaca"
          unit="bpm"
          data={vitals.filter((v) => v.type === "heart_rate")}
        />
        <VitalTrendChart
          title="Temperatura corporea"
          unit="°C"
          data={vitals.filter((v) => v.type === "temperature")}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-medium">Sintomi in corso</h2>
            <Link href="/symptoms" className="text-xs text-brand-700 hover:underline">
              Vedi tutti
            </Link>
          </div>
          {loading ? (
            <p className="text-sm text-stone-500">Caricamento...</p>
          ) : activeSymptoms.length === 0 ? (
            <p className="text-sm text-stone-500">Nessun sintomo attivo. 🎉</p>
          ) : (
            <ul className="space-y-2">
              {activeSymptoms.map((s) => (
                <li key={s.id} className="flex justify-between text-sm">
                  <span>{s.name}</span>
                  <span className="text-stone-400">{formatDate(s.date)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-medium">Prossimi controlli</h2>
            <Link href="/visits" className="text-xs text-brand-700 hover:underline">
              Vedi tutte
            </Link>
          </div>
          {loading ? (
            <p className="text-sm text-stone-500">Caricamento...</p>
          ) : upcomingVisits.length === 0 ? (
            <p className="text-sm text-stone-500">Nessun controllo programmato.</p>
          ) : (
            <ul className="space-y-2">
              {upcomingVisits.map((v) => (
                <li key={v.id} className="flex justify-between text-sm">
                  <span>{v.reason}</span>
                  <span className="text-stone-400">{formatDate(v.followUpDate!)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="card bg-brand-50 border-brand-100">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-medium text-brand-900">Non ti senti bene?</h2>
            <p className="text-sm text-brand-800">
              Chiedi consiglio all&apos;assistente AI: analizzerà i tuoi sintomi e i tuoi dati
              recenti e ti proporrà delle opzioni.
            </p>
          </div>
          <Link href="/assistant" className="btn-primary">
            Apri assistente
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, date }: { label: string; value: string; date?: string }) {
  return (
    <div className="card">
      <p className="text-xs font-medium text-stone-500">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
      {date && <p className="mt-1 text-xs text-stone-400">{formatDate(date)}</p>}
    </div>
  );
}
