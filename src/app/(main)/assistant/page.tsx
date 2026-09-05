"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage } from "@/lib/types";
import { formatDateTime } from "@/lib/format";

const SUGGESTIONS = [
  "Ho mal di testa da stamattina, forse per il freddo",
  "Ho la febbre a 38, cosa dovrei fare?",
  "Ho la tosse da 3 giorni, meglio fare degli esami?",
  "La mia pressione è più alta del solito, che test posso fare a casa?",
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/assistant")
      .then((r) => r.json())
      .then(setMessages)
      .finally(() => setHistoryLoading(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setError(null);
    setInput("");
    setMessages((prev) => [
      ...prev,
      { id: `tmp-${Date.now()}`, role: "user", content: trimmed, createdAt: new Date().toISOString() },
    ]);
    setLoading(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore dell'assistente");
      setMessages((prev) => {
        const withoutTmp = prev.filter((m) => !m.id.startsWith("tmp-"));
        return [...withoutTmp, data.userMessage, data.assistantMessage];
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function clearHistory() {
    if (!confirm("Cancellare tutta la cronologia della chat?")) return;
    await fetch("/api/assistant", { method: "DELETE" });
    setMessages([]);
  }

  return (
    <div className="flex h-[calc(100vh-140px)] min-h-[500px] flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">Assistente AI per la salute</h1>
        <p className="text-sm text-stone-500">
          Descrivi un sintomo o fai una domanda: l&apos;assistente terrà conto dei tuoi dati
          recenti registrati nell&apos;app.
        </p>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        ⚠️ Non è un servizio medico e non sostituisce un medico. In caso di emergenza (es.
        dolore toracico intenso, difficoltà respiratorie gravi, perdita di coscienza, pensieri di
        farsi del male) chiama subito il <strong>112</strong> (o il numero di emergenza locale) o
        recati al pronto soccorso.
      </div>

      <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-stone-200 bg-white">
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {historyLoading ? (
            <p className="text-sm text-stone-500">Caricamento cronologia...</p>
          ) : messages.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-stone-500">
                Nessun messaggio ancora. Prova con una di queste domande:
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="btn-secondary text-xs"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={`max-w-[85%] rounded-xl px-4 py-2 text-sm ${
                    m.role === "user"
                      ? "bg-brand-600 text-white"
                      : "bg-stone-100 text-stone-900"
                  }`}
                >
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none prose-headings:mt-3 prose-headings:mb-1 prose-p:my-1 prose-ul:my-1">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  )}
                  <p
                    className={`mt-1 text-[10px] ${
                      m.role === "user" ? "text-brand-100" : "text-stone-400"
                    }`}
                  >
                    {formatDateTime(m.createdAt)}
                  </p>
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-xl bg-stone-100 px-4 py-2 text-sm text-stone-500">
                L&apos;assistente sta scrivendo...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="flex items-center gap-2 border-t border-stone-200 p-3"
        >
          <input
            className="input"
            placeholder="Descrivi il sintomo o fai una domanda..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" className="btn-primary" disabled={loading || !input.trim()}>
            Invia
          </button>
        </form>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="text-right">
        <button onClick={clearHistory} className="text-xs text-stone-400 hover:underline">
          Cancella cronologia chat
        </button>
      </div>
    </div>
  );
}
