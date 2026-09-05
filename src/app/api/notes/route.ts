import { makeCollectionRoutes, requireString } from "@/lib/crudHandlers";
import type { Note, NoteCategory } from "@/lib/types";

const CATEGORIES: NoteCategory[] = ["idea", "bug", "feature_request", "other"];

function buildItem(body: any, id: string, now: string): Note {
  const text = requireString(body, "text");
  const category: NoteCategory = CATEGORIES.includes(body.category) ? body.category : "idea";

  return {
    id,
    date: typeof body.date === "string" && body.date ? body.date : now,
    text,
    category,
    status: body.status === "done" ? "done" : "open",
    createdAt: now,
  };
}

export const { GET, POST } = makeCollectionRoutes("notes", buildItem);
