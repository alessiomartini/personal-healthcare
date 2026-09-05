import { NextRequest, NextResponse } from "next/server";
import { getAll, insert, update, remove, newId } from "@/lib/db";
import type { CollectionName } from "@/lib/types";

type SortKeyed = { date?: string; createdAt: string };

function sortNewestFirst(items: SortKeyed[]): SortKeyed[] {
  return [...items].sort((a, b) => (b.date || b.createdAt).localeCompare(a.date || a.createdAt));
}

/** Builds GET (list) + POST (create) handlers for a top-level collection route. */
export function makeCollectionRoutes<K extends CollectionName>(
  collection: K,
  buildItem: (body: any, id: string, now: string) => any
) {
  async function GET() {
    const items = await getAll(collection);
    return NextResponse.json(sortNewestFirst(items as any[]));
  }

  async function POST(req: NextRequest) {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "JSON non valido" }, { status: 400 });
    }
    const id = newId();
    const now = new Date().toISOString();
    let item: any;
    try {
      item = buildItem(body, id, now);
    } catch (e: any) {
      return NextResponse.json({ error: e?.message || "Dati non validi" }, { status: 400 });
    }
    await insert(collection, item);
    return NextResponse.json(item, { status: 201 });
  }

  return { GET, POST };
}

/** Builds PATCH (partial update) + DELETE handlers for a `[id]` sub-route. */
export function makeItemRoutes<K extends CollectionName>(collection: K) {
  async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "JSON non valido" }, { status: 400 });
    }
    delete body.id;
    delete body.createdAt;
    const updated = await update(collection, params.id, body);
    if (!updated) {
      return NextResponse.json({ error: "Non trovato" }, { status: 404 });
    }
    return NextResponse.json(updated);
  }

  async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
    const ok = await remove(collection, params.id);
    if (!ok) {
      return NextResponse.json({ error: "Non trovato" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  }

  return { PATCH, DELETE };
}

export function requireString(body: any, field: string): string {
  const v = body[field];
  if (typeof v !== "string" || v.trim().length === 0) {
    throw new Error(`Campo obbligatorio mancante: ${field}`);
  }
  return v;
}

export function requireNumber(body: any, field: string): number {
  const v = Number(body[field]);
  if (!Number.isFinite(v)) {
    throw new Error(`Campo numerico obbligatorio mancante: ${field}`);
  }
  return v;
}
