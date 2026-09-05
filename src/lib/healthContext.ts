import { getAll } from "@/lib/db";

const DAYS_OF_HISTORY = 30;

function withinDays(iso: string, days: number): boolean {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t <= days * 24 * 60 * 60 * 1000;
}

/**
 * Builds a compact, human-readable summary of the user's recent logged data
 * so the AI assistant can ground its suggestions in real trends instead of
 * asking the user to repeat everything.
 */
export async function buildHealthContextSummary(): Promise<string> {
  const [vitals, symptoms, visits, bloodTests] = await Promise.all([
    getAll("vitals"),
    getAll("symptoms"),
    getAll("visits"),
    getAll("bloodTests"),
  ]);

  const lines: string[] = [];

  const recentVitals = vitals.filter((v) => withinDays(v.date, DAYS_OF_HISTORY));
  const byType = new Map<string, typeof recentVitals>();
  for (const v of recentVitals) {
    const arr = byType.get(v.type) || [];
    arr.push(v);
    byType.set(v.type, arr);
  }
  if (byType.size > 0) {
    lines.push(`Parametri vitali degli ultimi ${DAYS_OF_HISTORY} giorni:`);
    for (const [type, entries] of byType) {
      const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
      const latest = sorted[sorted.length - 1];
      const values = sorted.map((e) =>
        e.value2 !== undefined ? `${e.value}/${e.value2}` : `${e.value}`
      );
      lines.push(
        `- ${type}: ${entries.length} misurazioni, ultima ${latest.value}${
          latest.value2 !== undefined ? "/" + latest.value2 : ""
        } ${latest.unit} il ${latest.date.slice(0, 10)}. Sequenza: ${values.join(", ")}`
      );
    }
  } else {
    lines.push("Nessun parametro vitale registrato negli ultimi 30 giorni.");
  }

  const activeSymptoms = symptoms.filter((s) => !s.resolved);
  if (activeSymptoms.length > 0) {
    lines.push("\nSintomi attualmente in corso (non risolti):");
    for (const s of activeSymptoms) {
      lines.push(
        `- ${s.name} (intensità ${s.severity}/5) da ${s.date.slice(0, 10)}${
          s.possibleTriggers ? `, possibili cause indicate dall'utente: ${s.possibleTriggers}` : ""
        }${s.notes ? `. Note: ${s.notes}` : ""}`
      );
    }
  }

  const recentSymptoms = symptoms
    .filter((s) => s.resolved && withinDays(s.date, DAYS_OF_HISTORY))
    .slice(-5);
  if (recentSymptoms.length > 0) {
    lines.push("\nSintomi recenti già risolti:");
    for (const s of recentSymptoms) {
      lines.push(`- ${s.name} (${s.date.slice(0, 10)} → risolto ${s.resolvedDate?.slice(0, 10) || ""})`);
    }
  }

  const lastVisit = [...visits].sort((a, b) => b.date.localeCompare(a.date))[0];
  if (lastVisit) {
    lines.push(
      `\nUltima visita medica: ${lastVisit.date.slice(0, 10)} - ${lastVisit.reason}${
        lastVisit.outcome ? ` (esito: ${lastVisit.outcome})` : ""
      }`
    );
  }

  const lastBloodTest = [...bloodTests].sort((a, b) => b.date.localeCompare(a.date))[0];
  if (lastBloodTest) {
    const outOfRange = lastBloodTest.results.filter((r) => r.flag && r.flag !== "normal");
    lines.push(
      `\nUltimo esame del sangue: ${lastBloodTest.panelName} del ${lastBloodTest.date.slice(0, 10)}.` +
        (outOfRange.length > 0
          ? ` Valori fuori range: ${outOfRange
              .map((r) => `${r.name}=${r.value}${r.unit || ""} (${r.flag})`)
              .join(", ")}`
          : " Nessun valore segnalato come fuori range.")
    );
  }

  return lines.join("\n");
}
