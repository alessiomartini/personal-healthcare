import { makeCollectionRoutes, requireString } from "@/lib/crudHandlers";
import type { BloodTest, BloodTestResult } from "@/lib/types";

function sanitizeResults(input: any): BloodTestResult[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((r) => r && typeof r === "object" && typeof r.name === "string" && r.name.trim())
    .map((r) => ({
      name: String(r.name),
      value: String(r.value ?? ""),
      unit: typeof r.unit === "string" ? r.unit : undefined,
      referenceRange: typeof r.referenceRange === "string" ? r.referenceRange : undefined,
      flag: ["low", "normal", "high"].includes(r.flag) ? r.flag : undefined,
    }));
}

function buildItem(body: any, id: string, now: string): BloodTest {
  const date = requireString(body, "date");
  const panelName = requireString(body, "panelName");

  return {
    id,
    date,
    labName: typeof body.labName === "string" ? body.labName : undefined,
    panelName,
    results: sanitizeResults(body.results),
    notes: typeof body.notes === "string" ? body.notes : undefined,
    createdAt: now,
  };
}

export const { GET, POST } = makeCollectionRoutes("bloodTests", buildItem);
