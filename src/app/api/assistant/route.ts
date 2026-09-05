import { NextRequest, NextResponse } from "next/server";
import { getAll, insert, newId, clear } from "@/lib/db";
import { callHealthAssistant, type ChatTurn } from "@/lib/anthropic";
import { buildHealthContextSummary } from "@/lib/healthContext";
import type { ChatMessage } from "@/lib/types";

export async function GET() {
  const chats = await getAll("chats");
  const sorted = [...chats].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return NextResponse.json(sorted);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (!message) {
    return NextResponse.json({ error: "Messaggio mancante" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const userMessage: ChatMessage = {
    id: newId(),
    role: "user",
    content: message,
    createdAt: now,
  };
  await insert("chats", userMessage);

  const history = await getAll("chats");
  const sortedHistory = [...history].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const turns: ChatTurn[] = sortedHistory.map((m) => ({ role: m.role, content: m.content }));

  let replyText: string;
  try {
    const contextSummary = await buildHealthContextSummary();
    replyText = await callHealthAssistant(turns, contextSummary);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Errore dell'assistente" }, { status: 502 });
  }

  const assistantMessage: ChatMessage = {
    id: newId(),
    role: "assistant",
    content: replyText,
    createdAt: new Date().toISOString(),
  };
  await insert("chats", assistantMessage);

  return NextResponse.json({ userMessage, assistantMessage });
}

export async function DELETE() {
  await clear("chats");
  return NextResponse.json({ ok: true });
}
