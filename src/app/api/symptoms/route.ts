import { makeCollectionRoutes, requireString } from "@/lib/crudHandlers";
import type { Symptom, SymptomSeverity } from "@/lib/types";

function buildItem(body: any, id: string, now: string): Symptom {
  const date = requireString(body, "date");
  const name = requireString(body, "name");
  const severityNum = Number(body.severity ?? 3);
  const severity = (Math.min(5, Math.max(1, Math.round(severityNum))) ||
    3) as SymptomSeverity;

  return {
    id,
    date,
    name,
    severity,
    possibleTriggers:
      typeof body.possibleTriggers === "string" ? body.possibleTriggers : undefined,
    notes: typeof body.notes === "string" ? body.notes : undefined,
    resolved: Boolean(body.resolved),
    resolvedDate:
      typeof body.resolvedDate === "string" ? body.resolvedDate : undefined,
    createdAt: now,
  };
}

export const { GET, POST } = makeCollectionRoutes("symptoms", buildItem);
