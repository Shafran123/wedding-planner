"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR, { mutate } from "swr";
import { ArrowLeft, Pencil, Trash2, Check } from "lucide-react";
import type { Task } from "@wedding/shared";
import { api, swrFetcher } from "@/lib/api";
import { useWedding } from "@/contexts/wedding";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoader, ErrorState } from "@/components/ui/empty";
import { PriorityBadge, TaskStatusBadge } from "@/components/shared/badges";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { TaskFormDialog } from "@/components/features/task-form";
import { formatMinor, formatDate } from "@/lib/format";

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { role, wedding } = useWedding();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);

  const { data, error, isLoading } = useSWR<{ task: Task }>(
    `/api/tasks/${id}`,
    swrFetcher,
  );

  if (isLoading) return <PageLoader />;
  if (error || !data) {
    return (
      <ErrorState
        message="We couldn't find that task."
        onRetry={() => router.push("/tasks")}
      />
    );
  }

  const task = data.task;
  const canWrite = role !== "viewer";

  const toggleComplete = async () => {
    await api(`/api/tasks/${task.id}`, {
      method: "PATCH",
      body: { status: task.status === "completed" ? "todo" : "completed" },
    });
    await Promise.all([mutate(`/api/tasks/${task.id}`), mutate("/api/tasks"), mutate("/api/dashboard")]);
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await api(`/api/tasks/${task.id}`, { method: "DELETE" });
      await Promise.all([mutate("/api/tasks"), mutate("/api/dashboard")]);
      router.push("/tasks");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <button
        onClick={() => router.push("/tasks")}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-stone-warm hover:text-charcoal"
      >
        <ArrowLeft className="h-4 w-4" /> Back to tasks
      </button>

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-charcoal">{task.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <PriorityBadge priority={task.priority} />
            <TaskStatusBadge status={task.status} />
            {task.categoryName && <span className="text-xs text-stone-warm">{task.categoryName}</span>}
          </div>
        </div>
        {canWrite && (
          <div className="flex gap-2">
            <Button variant={task.status === "completed" ? "outline" : "default"} size="sm" onClick={() => void toggleComplete()}>
              <Check className="h-3.5 w-3.5" />
              {task.status === "completed" ? "Reopen" : "Complete"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDeleting(true)}>
              <Trash2 className="h-3.5 w-3.5 text-red-700" />
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {task.description && (
          <Card>
            <CardHeader><CardTitle>Description</CardTitle></CardHeader>
            <CardContent className="whitespace-pre-wrap text-sm text-charcoal">
              {task.description}
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-stone-warm">Due</dt>
                <dd className="mt-1 text-charcoal">{formatDate(task.dueDate)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-stone-warm">Assigned to</dt>
                <dd className="mt-1 text-charcoal">{task.assigneeName ?? "Anyone"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-stone-warm">Estimated cost</dt>
                <dd className="mt-1 text-charcoal">
                  {task.estimatedCostMinor !== undefined
                    ? formatMinor(task.estimatedCostMinor, wedding?.currency)
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-stone-warm">Actual cost</dt>
                <dd className="mt-1 text-charcoal">
                  {task.actualCostMinor !== undefined
                    ? formatMinor(task.actualCostMinor, wedding?.currency)
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-stone-warm">Completed</dt>
                <dd className="mt-1 text-charcoal">{task.completedAt ? formatDate(task.completedAt) : "Not yet"}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <TaskFormDialog
        open={editing}
        task={task}
        onOpenChange={setEditing}
        onSaved={() => {
          setEditing(false);
          void Promise.all([mutate(`/api/tasks/${task.id}`), mutate("/api/tasks")]);
        }}
      />
      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title="Delete task?"
        description={`"${task.title}" will be removed permanently.`}
        busy={busy}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
