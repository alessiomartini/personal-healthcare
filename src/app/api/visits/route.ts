import { makeCollectionRoutes, requireString } from "@/lib/crudHandlers";
import type { Visit } from "@/lib/types";

function buildItem(body: any, id: string, now: string): Visit {
  const date = requireString(body, "date");
  const reason = requireString(body, "reason");

  return {
    id,
    date,
    doctorName: typeof body.doctorName === "string" ? body.doctorName : undefined,
    specialty: typeof body.specialty === "string" ? body.specialty : undefined,
    reason,
    outcome: typeof body.outcome === "string" ? body.outcome : undefined,
    notes: typeof body.notes === "string" ? body.notes : undefined,
    followUpDate:
      typeof body.followUpDate === "string" && body.followUpDate
        ? body.followUpDate
        : undefined,
    createdAt: now,
  };
}

export const { GET, POST } = makeCollectionRoutes("visits", buildItem);
