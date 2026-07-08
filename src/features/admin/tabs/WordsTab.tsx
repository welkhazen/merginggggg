import { useState } from "react";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { captureAdminEvent, captureAdminException } from "@/lib/analytics";
import {
  addBannedWord,
  addBlockedWord,
  fetchBannedWords,
  fetchBlockedWords,
  removeBannedWord,
  removeBlockedWord,
} from "@/lib/adminApi";
import { AdminButton, EmptyState, Field, formatDate, Panel, Row, SelectField, Tag, useAsyncData } from "../ui";

export function WordsTab() {
  return (
    <>
      <BlockedWordsPanel />
      <BannedWordsPanel />
    </>
  );
}

function BlockedWordsPanel() {
  const { data: words, loading, reload, setData } = useAsyncData(fetchBlockedWords);
  const [term, setTerm] = useState("");

  async function save() {
    try {
      const saved = await addBlockedWord(term.trim());
      captureAdminEvent("admin_blocked_word_added");
      setData((current) => [...(current ?? []).filter((word) => word.id !== saved.id), saved]);
      setTerm("");
      toast({ title: "Blocked word saved" });
    } catch (error) {
      captureAdminException(error, { action: "admin_blocked_word_add" });
      toast({ title: "Could not save word" });
    }
  }

  async function remove(id: string) {
    try {
      await removeBlockedWord(id);
      captureAdminEvent("admin_blocked_word_removed");
      setData((current) => (current ?? []).filter((word) => word.id !== id));
    } catch (error) {
      captureAdminException(error, { action: "admin_blocked_word_remove" });
      toast({ title: "Could not remove word" });
    }
  }

  return (
    <Panel
      title="Blocked words"
      hint="Hard-blocked terms — messages containing them are rejected."
      actions={
        <AdminButton tone="outline" disabled={loading} onClick={reload} aria-label="Refresh blocked words">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </AdminButton>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <Field value={term} onChange={(event) => setTerm(event.target.value)} placeholder="Word or phrase" />
          <AdminButton disabled={!term.trim()} onClick={() => void save()}>
            <Plus className="h-4 w-4" /> Save word
          </AdminButton>
        </div>
        {words && words.length === 0 && <EmptyState>No blocked words saved yet.</EmptyState>}
        <div className="space-y-2">
          {words?.map((word) => (
            <Row key={word.id}>
              <div>
                <p className="text-sm text-raw-text">{word.term}</p>
                <p className="text-[10px] text-raw-silver/35">Saved {formatDate(word.createdAt)}</p>
              </div>
              <AdminButton tone="danger" onClick={() => void remove(word.id)} aria-label={`Delete ${word.term}`}>
                <Trash2 className="h-4 w-4" />
              </AdminButton>
            </Row>
          ))}
        </div>
      </div>
    </Panel>
  );
}

function BannedWordsPanel() {
  const { data: words, loading, reload, setData } = useAsyncData(fetchBannedWords);
  const [word, setWord] = useState("");
  const [action, setAction] = useState<"block" | "flag" | "shadow">("flag");
  const [category, setCategory] = useState("");

  async function save() {
    try {
      const saved = await addBannedWord(word.trim(), action, category.trim() || undefined);
      captureAdminEvent("admin_banned_word_added", { action });
      setData((current) => [...(current ?? []).filter((entry) => entry.id !== saved.id), saved]);
      setWord("");
      setCategory("");
      toast({ title: "Banned word saved" });
    } catch (error) {
      captureAdminException(error, { action: "admin_banned_word_add" });
      toast({ title: "Could not save word" });
    }
  }

  async function remove(id: string) {
    try {
      await removeBannedWord(id);
      captureAdminEvent("admin_banned_word_removed");
      setData((current) => (current ?? []).filter((entry) => entry.id !== id));
    } catch (error) {
      captureAdminException(error, { action: "admin_banned_word_remove" });
      toast({ title: "Could not remove word" });
    }
  }

  return (
    <Panel
      title="Banned words (auto-moderation)"
      hint="Terms watched by the auto-moderation filter, with a per-word action."
      actions={
        <AdminButton tone="outline" disabled={loading} onClick={reload} aria-label="Refresh banned words">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </AdminButton>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-[1fr_130px_150px_auto]">
          <Field value={word} onChange={(event) => setWord(event.target.value)} placeholder="Word or phrase" />
          <SelectField value={action} onChange={(event) => setAction(event.target.value as typeof action)}>
            <option value="flag">Flag</option>
            <option value="block">Block</option>
            <option value="shadow">Shadow</option>
          </SelectField>
          <Field value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Category (optional)" />
          <AdminButton disabled={!word.trim()} onClick={() => void save()}>
            <Plus className="h-4 w-4" /> Save
          </AdminButton>
        </div>
        {words && words.length === 0 && <EmptyState>No banned words configured.</EmptyState>}
        <div className="space-y-2">
          {words?.map((entry) => (
            <Row key={entry.id}>
              <div>
                <p className="flex flex-wrap items-center gap-2 text-sm text-raw-text">
                  {entry.word}
                  {entry.action && <Tag tone={entry.action.toLowerCase() === "block" ? "red" : "gold"}>{entry.action.toLowerCase()}</Tag>}
                  {entry.category && <Tag tone="teal">{entry.category.toLowerCase()}</Tag>}
                </p>
                <p className="text-[10px] text-raw-silver/35">
                  Added {entry.addedBy ? `by ${entry.addedBy} ` : ""}{formatDate(entry.createdAt)}
                </p>
              </div>
              <AdminButton tone="danger" onClick={() => void remove(entry.id)} aria-label={`Delete ${entry.word}`}>
                <Trash2 className="h-4 w-4" />
              </AdminButton>
            </Row>
          ))}
        </div>
      </div>
    </Panel>
  );
}
