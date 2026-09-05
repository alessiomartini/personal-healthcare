import { promises as fs } from "fs";
import path from "path";
import type { CollectionName, Database } from "./types";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

const EMPTY_DB: Database = {
  vitals: [],
  symptoms: [],
  visits: [],
  bloodTests: [],
  notes: [],
  chats: [],
};

let cache: Database | null = null;
// Serializes all writes so concurrent requests never interleave file writes.
let writeQueue: Promise<void> = Promise.resolve();

async function ensureFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DB_FILE);
  } catch {
    await fs.writeFile(DB_FILE, JSON.stringify(EMPTY_DB, null, 2), "utf-8");
  }
}

async function load(): Promise<Database> {
  if (cache) return cache;
  await ensureFile();
  const raw = await fs.readFile(DB_FILE, "utf-8");
  const parsed = JSON.parse(raw) as Partial<Database>;
  cache = { ...EMPTY_DB, ...parsed };
  return cache;
}

async function persist(db: Database): Promise<void> {
  cache = db;
  const tmpFile = `${DB_FILE}.tmp`;
  await fs.writeFile(tmpFile, JSON.stringify(db, null, 2), "utf-8");
  await fs.rename(tmpFile, DB_FILE);
}

function enqueueWrite(mutator: (db: Database) => Database): Promise<Database> {
  const result = writeQueue.then(async () => {
    const db = await load();
    const next = mutator(db);
    await persist(next);
  });
  writeQueue = result.catch(() => undefined);
  return result.then(() => cache as Database);
}

export async function getAll<K extends CollectionName>(
  collection: K
): Promise<Database[K]> {
  const db = await load();
  return db[collection];
}

export async function getById<K extends CollectionName>(
  collection: K,
  id: string
): Promise<Database[K][number] | undefined> {
  const items = await getAll(collection);
  return (items as any[]).find((item) => item.id === id);
}

export async function insert<K extends CollectionName>(
  collection: K,
  item: Database[K][number]
): Promise<Database[K][number]> {
  await enqueueWrite((db) => ({
    ...db,
    [collection]: [...(db[collection] as any[]), item],
  }));
  return item;
}

export async function insertMany<K extends CollectionName>(
  collection: K,
  newItems: Database[K][number][]
): Promise<Database[K][number][]> {
  await enqueueWrite((db) => ({
    ...db,
    [collection]: [...(db[collection] as any[]), ...newItems],
  }));
  return newItems;
}

export async function update<K extends CollectionName>(
  collection: K,
  id: string,
  patch: Partial<Database[K][number]>
): Promise<Database[K][number] | undefined> {
  let updated: any;
  await enqueueWrite((db) => {
    const items = db[collection] as any[];
    const idx = items.findIndex((item) => item.id === id);
    if (idx === -1) return db;
    updated = { ...items[idx], ...patch, id };
    const nextItems = [...items];
    nextItems[idx] = updated;
    return { ...db, [collection]: nextItems };
  });
  return updated;
}

export async function remove<K extends CollectionName>(
  collection: K,
  id: string
): Promise<boolean> {
  let removed = false;
  await enqueueWrite((db) => {
    const items = db[collection] as any[];
    const nextItems = items.filter((item) => {
      if (item.id === id) {
        removed = true;
        return false;
      }
      return true;
    });
    return { ...db, [collection]: nextItems };
  });
  return removed;
}

export async function clear<K extends CollectionName>(collection: K): Promise<void> {
  await enqueueWrite((db) => ({ ...db, [collection]: [] }));
}

export function newId(): string {
  return crypto.randomUUID();
}
