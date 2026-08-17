"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR, { mutate } from "swr";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { Note } from "@wedding/shared";
import { api, swrFetcher } from "@/lib/api";
import { useWedding } from "@/contexts/wedding";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PageLoader, ErrorState } from "@/components/ui/empty";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { NoteFormDialog } from "@/components/features/note-form";
import { NOTE_CATEGORY_LABELS } from "@/lib/labels";
import { relativeTime } from "@/lib/format";

export default function NoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { role } = useWedding();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);

  const { data, error, isLoading } = useSWR<{ note: Note }>(
    `/api/notes/${id}`,
    swrFetcher,
  );

  if (isLoading) return <PageLoader />;
  if (error || !data) {
    return <ErrorState message="We couldn't find that note." onRetry={() => router.push("/notes")} />;
  }

  const note = data.note;
  const canWrite = role === "owner" || role === "partner";

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await api(`/api/notes/${note.id}`, { method: "DELETE" });
      await mutate("/api/notes");
      router.push("/notes");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <button
        onClick={() => router.push("/notes")}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-stone-warm hover:text-charcoal"
      >
        <ArrowLeft className="h-4 w-4" /> Back to notes
      </button>

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-charcoal">{note.title}</h1>
          <div className="mt-2 flex items-center gap-2 text-xs text-stone-warm">
            <Badge variant="outline">{NOTE_CATEGORY_LABELS[note.category]}</Badge>
            <span>
              {note.createdByName ?? "Someone"} · updated {relativeTime(note.updatedAt)}
            </span>
          </div>
        </div>
        {canWrite && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDeleting(true)}>
              <Trash2 className="h-3.5 w-3.5 text-red-700" />
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="prose-sm p-6 [&_h1]:font-display [&_h1]:text-xl [&_h1]:font-semibold [&_a]:text-gold [&_ul]:list-disc [&_ol]:list-decimal [&_blockquote]:border-l-2 [&_blockquote]:border-sand [&_blockquote]:pl-3 [&_code]:rounded [&_code]:bg-parchment [&_code]:px-1 [&_li]:ml-4">
          <ReactMarkdown>{note.content || "_Empty note._"}</ReactMarkdown>
        </CardContent>
      </Card>

      <NoteFormDialog
        open={editing}
        note={note}
        onOpenChange={setEditing}
        onSaved={() => {
          setEditing(false);
          void Promise.all([mutate(`/api/notes/${note.id}`), mutate("/api/notes")]);
        }}
      />
      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title="Delete note?"
        description={`"${note.title}" will be removed.`}
        busy={busy}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
