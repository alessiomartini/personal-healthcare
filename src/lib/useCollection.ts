"use client";

import { useCallback, useEffect, useState } from "react";

export function useCollection<T extends { id: string }>(basePath: string) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(basePath);
      if (!res.ok) throw new Error("Errore nel caricamento dei dati");
      setItems(await res.json());
    } catch (e: any) {
      setError(e.message || "Errore sconosciuto");
    } finally {
      setLoading(false);
    }
  }, [basePath]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(
    async (data: Record<string, unknown>) => {
      const res = await fetch(basePath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Errore nella creazione");
      }
      await refresh();
    },
    [basePath, refresh]
  );

  const update = useCallback(
    async (id: string, patch: Record<string, unknown>) => {
      const res = await fetch(`${basePath}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("Errore nell'aggiornamento");
      await refresh();
    },
    [basePath, refresh]
  );

  const remove = useCallback(
    async (id: string) => {
      const res = await fetch(`${basePath}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Errore nell'eliminazione");
      await refresh();
    },
    [basePath, refresh]
  );

  return { items, loading, error, refresh, create, update, remove };
}
