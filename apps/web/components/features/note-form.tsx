"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { Note } from "@wedding/shared";
import { api } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea, FieldError } from "@/components/ui/input";
import { Spinner } from "@/components/ui/empty";
import { NOTE_CATEGORIES } from "@wedding/shared";
import { NOTE_CATEGORY_LABELS } from "@/lib/labels";

const schema = z.object({
  title: z.string().min(1, "Note title is required.").max(200),
  content: z.string().max(20000),
  category: z.string().default("general"),
});
type FormValues = z.input<typeof schema>;

export function NoteFormDialog({
  open,
  onOpenChange,
  note,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note?: Note;
  onSaved: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", content: "", category: "general" },
  });

  useEffect(() => {
    if (open) {
      reset({
        title: note?.title ?? "",
        content: note?.content ?? "",
        category: note?.category ?? "general",
      });
      setError(null);
    }
  }, [open, note, reset]);

  const onSubmit = async (values: FormValues) => {
    setBusy(true);
    setError(null);
    try {
      if (note) {
        await api(`/api/notes/${note.id}`, { method: "PATCH", body: values });
      } else {
        await api("/api/notes", { method: "POST", body: values });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't save this note.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{note ? "Edit note" : "New note"}</DialogTitle>
          <DialogDescription>Markdown formatting is supported.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="n-title">Title</Label>
            <Input id="n-title" autoFocus {...register("title")} />
            <FieldError message={errors.title?.message} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="n-category">Category</Label>
            <Select id="n-category" {...register("category")}>
              {NOTE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{NOTE_CATEGORY_LABELS[c]}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="n-content">Note</Label>
            <Textarea id="n-content" rows={8} {...register("content")} />
          </div>
          {error && <FieldError message={error} />}
          <DialogFooter>
            <Button type="submit" disabled={busy}>
              {busy && <Spinner />} {note ? "Save changes" : "Add note"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
