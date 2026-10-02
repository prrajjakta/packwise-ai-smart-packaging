import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, Eye, History, Pencil, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  type HistoryEntry,
  clearHistory,
  deleteHistoryEntry,
  loadHistory,
  openHistoryEntry,
  renameHistoryEntry,
} from "@/lib/storage";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Analysis history — PackWise AI" },
      { name: "description", content: "Revisit, rename and delete your previous packaging evaluations saved in this browser." },
      { property: "og:title", content: "Analysis history — PackWise AI" },
      { property: "og:description", content: "Your saved packaging evaluations, stored locally in your browser." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<HistoryEntry[] | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  useEffect(() => setEntries(loadHistory()), []);
  const refresh = () => setEntries(loadHistory());

  const startEdit = (e: HistoryEntry) => {
    setEditing(e.id);
    setDraft(e.name);
    setError("");
  };

  const saveEdit = (id: string) => {
    const name = draft.trim();
    if (!name) return setError("Please enter a name.");
    if (name.length > 80) return setError("Keep the name under 80 characters.");
    renameHistoryEntry(id, name);
    setEditing(null);
    refresh();
    toast.success("Analysis renamed");
  };

  const remove = (e: HistoryEntry) => {
    if (!window.confirm(`Delete "${e.name}"? This cannot be undone.`)) return;
    deleteHistoryEntry(e.id);
    refresh();
    toast.success("Analysis deleted");
  };

  const open = (id: string) => {
    if (openHistoryEntry(id)) navigate({ to: "/results" });
    else toast.error("Could not open this analysis.");
  };

  if (!entries) {
    return <div className="mx-auto max-w-5xl px-4 py-24 text-center text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">
            Analysis <span className="text-gradient-leaf">history</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Saved only in this browser. {entries.length} of 50 slots used.
          </p>
        </div>
        {entries.length > 0 && (
          <Button
            variant="outline"
            onClick={() => {
              if (!window.confirm("Delete all saved analyses?")) return;
              clearHistory();
              refresh();
              toast.success("History cleared");
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Clear all
          </Button>
        )}
      </div>

      {entries.length === 0 ? (
        <Card className="glass rounded-2xl p-10 text-center">
          <History className="mx-auto h-10 w-10 text-leaf" />
          <h2 className="mt-4 font-display text-xl font-semibold">No saved analyses yet</h2>
          <p className="mt-2 text-muted-foreground">Every analysis you run is saved here automatically.</p>
          <Button asChild className="mt-6">
            <Link to="/analyze">Start an analysis</Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {entries.map((e) => {
            const best = e.result.recommendations[0]!;
            return (
              <Card key={e.id} className="glass animate-rise rounded-2xl p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    {editing === e.id ? (
                      <div>
                        <div className="flex gap-2">
                          <Input
                            autoFocus
                            value={draft}
                            aria-label="Analysis name"
                            onChange={(ev) => setDraft(ev.target.value)}
                            onKeyDown={(ev) => {
                              if (ev.key === "Enter") saveEdit(e.id);
                              if (ev.key === "Escape") setEditing(null);
                            }}
                          />
                          <Button size="icon" aria-label="Save name" onClick={() => saveEdit(e.id)}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" aria-label="Cancel" onClick={() => setEditing(null)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
                      </div>
                    ) : (
                      <h2 className="truncate font-display text-lg font-semibold">{e.name}</h2>
                    )}
                    <p className="mt-1 text-sm text-muted-foreground">
                      {best.material.name} · score{" "}
                      <span className="font-medium text-mustard">{best.score}/100</span> · ~{best.predictedShelfLife} days
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="secondary" className="font-normal">{e.result.batchId}</Badge>
                      <Badge variant="secondary" className="font-normal">{e.result.input.storageType}</Badge>
                      <Badge variant="secondary" className="font-normal">
                        {new Date(e.result.createdAt).toLocaleString()}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => open(e.id)}>
                      <Eye className="mr-1.5 h-4 w-4" /> Open
                    </Button>
                    <Button size="sm" variant="outline" aria-label="Rename" onClick={() => startEdit(e)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" aria-label="Delete" onClick={() => remove(e)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
