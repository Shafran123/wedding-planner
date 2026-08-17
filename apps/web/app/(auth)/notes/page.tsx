"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import useSWR, { mutate } from "swr";
import { Plus, StickyNote, Pencil, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { Note } from "@wedding/shared";
import { api, swrFetcher } from "@/lib/api";
import { useWedding } from "@/contexts/wedding";
import { PageHeader } from "@/components/shared/page";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/ui/empty";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { NOTE_CATEGORY_LABELS } from "@/lib/labels";
import { NOTE_CATEGORIES } from "@wedding/shared";
import { NoteFormDialog } from "@/components/features/note-form";
import { relativeTime } from "@/lib/format";

export default function NotesPage() {
  const { role } = useWedding();
  const [category, setCategory] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [deleting, setDeleting] = useState<Note | null>(null);
  const [busy, setBusy] = useState(false);

  const { data, error, isLoading } = useSWR<{ notes: Note[] }>(
    "/api/notes",
    swrFetcher,
  );

  const canWrite = role === "owner" || role === "partner";
  const notes = useMemo(() => {
    const list = data?.notes ?? [];
    return category ? list.filter((n) => n.category === category) : list;
  }, [data, category]);

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api(`/api/notes/${deleting.id}`, { method: "DELETE" });
      await mutate("/api/notes");
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Notes"
        description="Ideas, shopping lists, meeting notes — everything worth remembering."
        action={
          canWrite && (
            <Button variant="gold" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" /> New note
            </Button>
          )
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        <button
          onClick={() => setCategory("")}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium ${category === "" ? "border-charcoal bg-charcoal text-cream" : "border-sand bg-white text-charcoal"}`}
        >
          All
        </button>
        {NOTE_CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium ${category === c ? "border-charcoal bg-charcoal text-cream" : "border-sand bg-white text-charcoal"}`}
          >
            {NOTE_CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>

      {isLoading && <ListSkeleton rows={4} />}
      {error && <ErrorState onRetry={() => void mutate("/api/notes")} />}

      {data && data.notes.length === 0 && (
        <EmptyState
          icon={StickyNote}
          title="No notes yet"
          description="Capture your first idea — a color palette, a cake flavour, a list of questions for the venue."
          actionLabel={canWrite ? "Add note" : undefined}
          onAction={() => setCreateOpen(true)}
        />
      )}

      {data && data.notes.length > 0 && notes.length === 0 && (
        <p className="py-10 text-center text-sm text-stone-warm">No notes in this category.</p>
      )}

      {notes.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => (
            <div key={note.id} className="group relative rounded-2xl border border-sand bg-white p-5 transition-shadow hover:shadow-md">
              <div className="mb-2 flex items-start justify-between gap-2">
                <Link href={`/notes/${note.id}`} className="min-w-0 flex-1">
                  <p className="truncate font-medium text-charcoal group-hover:text-gold">{note.title}</p>
                </Link>
                <Badge variant="outline">{NOTE_CATEGORY_LABELS[note.category]}</Badge>
              </div>
              <div className="line-clamp-3 text-sm text-stone-warm">
                <ReactMarkdown>{note.content.slice(0, 400)}</ReactMarkdown>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-stone-warm">
                <span>{note.createdByName ?? "Someone"} · {relativeTime(note.updatedAt)}</span>
                {canWrite && (
                  <span className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button variant="ghost" size="icon" aria-label={`Edit ${note.title}`} onClick={() => setEditing(note)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label={`Delete ${note.title}`} onClick={() => setDeleting(note)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <NoteFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSaved={() => {
          setCreateOpen(false);
          void mutate("/api/notes");
        }}
      />
      {editing && (
        <NoteFormDialog
          open
          note={editing}
          onOpenChange={(open) => !open && setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void mutate("/api/notes");
          }}
        />
      )}
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete note?"
        description={`"${deleting?.title}" will be removed.`}
        busy={busy}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
