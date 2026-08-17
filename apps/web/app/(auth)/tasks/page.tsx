"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import useSWR, { mutate } from "swr";
import { Plus, Check, Search, List, Columns3, Pencil, Trash2, Circle } from "lucide-react";
import type { Task } from "@wedding/shared";
import { api, swrFetcher } from "@/lib/api";
import { useWedding } from "@/contexts/wedding";
import { PageHeader } from "@/components/shared/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/ui/empty";
import { PriorityBadge, TaskStatusBadge } from "@/components/shared/badges";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { relativeDue } from "@/lib/format";
import { TaskFormDialog } from "@/components/features/task-form";
import { cn } from "@/lib/utils";

export default function TasksPage() {
  const { role } = useWedding();
  const [view, setView] = useState<"list" | "kanban">("list");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState<Task | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const { data, error, isLoading } = useSWR<{ tasks: Task[] }>(
    "/api/tasks",
    swrFetcher,
  );

  const canWrite = role !== "viewer";

  const filtered = useMemo(() => {
    const tasks = data?.tasks ?? [];
    return tasks.filter((t) => {
      if (statusFilter && t.status !== statusFilter) return false;
      if (priorityFilter && t.priority !== priorityFilter) return false;
      if (query && !t.title.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [data, statusFilter, priorityFilter, query]);

  const toggleComplete = async (task: Task) => {
    await api(`/api/tasks/${task.id}`, {
      method: "PATCH",
      body: { status: task.status === "completed" ? "todo" : "completed" },
    });
    await Promise.all([mutate("/api/tasks"), mutate("/api/dashboard")]);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await api(`/api/tasks/${deleting.id}`, { method: "DELETE" });
      await Promise.all([mutate("/api/tasks"), mutate("/api/dashboard")]);
      setDeleting(null);
    } finally {
      setDeleteBusy(false);
    }
  };

  const openCount = filtered.filter((t) => t.status === "todo" || t.status === "in_progress").length;

  return (
    <div>
      <PageHeader
        title="Tasks"
        description={
          data
            ? `${openCount} open of ${filtered.filter((t) => t.status !== "cancelled").length} tasks`
            : undefined
        }
        action={
          canWrite && (
            <Button variant="gold" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" /> New task
            </Button>
          )
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Tabs value={view} onValueChange={(v) => setView(v as "list" | "kanban")}>
          <TabsList>
            <TabsTrigger value="list">
              <List className="mr-1.5 h-3.5 w-3.5" aria-hidden /> List
            </TabsTrigger>
            <TabsTrigger value="kanban">
              <Columns3 className="mr-1.5 h-3.5 w-3.5" aria-hidden /> Kanban
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative min-w-44 flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-3 h-4 w-4 text-stone-warm" aria-hidden />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks…"
            className="pl-9"
            aria-label="Search tasks"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-lg border border-sand bg-white px-3 text-sm"
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="h-10 rounded-lg border border-sand bg-white px-3 text-sm"
          aria-label="Filter by priority"
        >
          <option value="">All priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {isLoading && <ListSkeleton rows={6} />}
      {error && <ErrorState onRetry={() => void mutate("/api/tasks")} />}

      {data && data.tasks.length === 0 && (
        <EmptyState
          title="No tasks yet"
          description="Start your plan — add the first thing you need to do, or we can generate a smart checklist from your wedding date."
          actionLabel={canWrite ? "Add task" : undefined}
          onAction={() => setCreateOpen(true)}
        />
      )}

      {data && data.tasks.length > 0 && filtered.length === 0 && (
        <p className="py-10 text-center text-sm text-stone-warm">
          No tasks match your filters.
        </p>
      )}

      {data && view === "list" && filtered.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-sand bg-white">
          <ul className="divide-y divide-sand">
            {filtered.map((task) => (
              <li key={task.id} className="group flex items-center gap-3 px-4 py-3 hover:bg-parchment/50">
                {canWrite && (
                  <button
                    onClick={() => void toggleComplete(task)}
                    aria-label={task.status === "completed" ? "Mark as not done" : "Mark as completed"}
                    className="shrink-0"
                  >
                    {task.status === "completed" ? (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    ) : (
                      <Circle className="h-6 w-6 text-sand group-hover:text-stone-warm" />
                    )}
                  </button>
                )}
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/tasks/${task.id}`}
                    className={cn(
                      "block truncate text-sm font-medium text-charcoal hover:text-gold",
                      task.status === "completed" && "text-stone-warm line-through",
                    )}
                  >
                    {task.title}
                  </Link>
                  <p className="truncate text-xs text-stone-warm">
                    {task.categoryName ?? "Other"}
                    {task.assigneeName ? ` · ${task.assigneeName}` : ""}
                  </p>
                </div>
                <div className="hidden items-center gap-2 md:flex">
                  <PriorityBadge priority={task.priority} />
                  <TaskStatusBadge status={task.status} />
                  <span className="w-24 text-right text-xs text-stone-warm">
                    {relativeDue(task.dueDate)}
                  </span>
                </div>
                <div className="flex gap-1">
                  {canWrite && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Edit ${task.title}`}
                        onClick={() => setEditing(task)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete ${task.title}`}
                        onClick={() => setDeleting(task)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data && view === "kanban" && filtered.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          {(["todo", "in_progress", "completed"] as const).map((column) => {
            const items = filtered.filter((t) => t.status === column);
            return (
              <div key={column} className="rounded-2xl border border-sand bg-parchment/50 p-3">
                <div className="mb-3 flex items-center justify-between px-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-warm">
                    {column === "todo" ? "To Do" : column === "in_progress" ? "In Progress" : "Completed"}
                  </p>
                  <Badge variant="outline">{items.length}</Badge>
                </div>
                <div className="space-y-2">
                  {items.map((task) => (
                    <Link
                      key={task.id}
                      href={`/tasks/${task.id}`}
                      className="block rounded-xl border border-sand bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <p className={cn("text-sm font-medium text-charcoal", task.status === "completed" && "line-through text-stone-warm")}>
                        {task.title}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <PriorityBadge priority={task.priority} />
                        <span className="text-xs text-stone-warm">{relativeDue(task.dueDate)}</span>
                      </div>
                    </Link>
                  ))}
                  {items.length === 0 && (
                    <p className="rounded-xl border border-dashed border-sand p-4 text-center text-xs text-stone-warm">
                      Nothing here
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <TaskFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSaved={() => {
          setCreateOpen(false);
          void Promise.all([mutate("/api/tasks"), mutate("/api/dashboard")]);
        }}
      />
      {editing && (
        <TaskFormDialog
          open
          task={editing}
          onOpenChange={(open) => !open && setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void Promise.all([mutate("/api/tasks"), mutate("/api/dashboard")]);
          }}
        />
      )}
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete task?"
        description={`"${deleting?.title}" will be removed permanently.`}
        busy={deleteBusy}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
