"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { Plus, Pencil, Trash2, Lock, Check, X } from "lucide-react";
import type { BudgetCategory, TaskCategory } from "@wedding/shared";
import { api, swrFetcher } from "@/lib/api";
import { parseToMinor } from "@/lib/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { formatMinor } from "@/lib/format";
import { useWedding } from "@/contexts/wedding";

type BudgetCat = BudgetCategory & { expenseCount?: number };
type TaskCat = TaskCategory & { taskCount?: number };

function RenameRow({
  initial,
  onSave,
  onCancel,
}: {
  initial: string;
  onSave: (name: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-1 items-center gap-2">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        aria-label="Category name"
        className="h-8 flex-1"
        autoFocus
      />
      <Button
        variant="ghost"
        size="icon"
        aria-label="Save rename"
        disabled={busy || !name.trim()}
        onClick={() => {
          setBusy(true);
          setError(null);
          void onSave(name.trim())
            .catch((err: unknown) =>
              setError(err instanceof Error ? err.message : "Couldn't rename."),
            )
            .finally(() => setBusy(false));
        }}
      >
        <Check className="h-4 w-4 text-emerald-700" />
      </Button>
      <Button variant="ghost" size="icon" aria-label="Cancel rename" onClick={onCancel}>
        <X className="h-4 w-4 text-stone-warm" />
      </Button>
      {error && <FieldError message={error} />}
    </div>
  );
}

export function CategoriesManager() {
  const { wedding } = useWedding();
  const baseCurrency = wedding?.currency ?? "AED";

  const { data: budgetData } = useSWR<{ categories: BudgetCat[] }>(
    "/api/budget",
    swrFetcher,
  );
  const { data: taskData } = useSWR<{ categories: TaskCat[] }>(
    "/api/task-categories",
    swrFetcher,
  );

  const [budgetName, setBudgetName] = useState("");
  const [budgetPlanned, setBudgetPlanned] = useState("");
  const [taskName, setTaskName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [deletingBudget, setDeletingBudget] = useState<BudgetCat | null>(null);
  const [deletingTask, setDeletingTask] = useState<TaskCat | null>(null);

  const budgetCategories = budgetData?.categories ?? [];
  const taskCategories = taskData?.categories ?? [];

  const addBudget = async () => {
    setBusy(true);
    setError(null);
    try {
      const plannedMinor = budgetPlanned ? parseToMinor(budgetPlanned) : 0;
      if (plannedMinor === null) {
        setError("Please enter a valid planned amount.");
        return;
      }
      await api("/api/budget/categories", {
        method: "POST",
        body: { name: budgetName.trim(), plannedMinor },
      });
      setBudgetName("");
      setBudgetPlanned("");
      await Promise.all([mutate("/api/budget"), mutate("/api/dashboard")]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't add the category.");
    } finally {
      setBusy(false);
    }
  };

  const addTask = async () => {
    setBusy(true);
    setError(null);
    try {
      await api("/api/task-categories", {
        method: "POST",
        body: { name: taskName.trim() },
      });
      setTaskName("");
      await mutate("/api/task-categories");
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't add the category.");
    } finally {
      setBusy(false);
    }
  };

  const renameBudget = async (id: string, name: string) => {
    await api(`/api/budget/categories/${id}`, { method: "PATCH", body: { name } });
    setEditingBudget(null);
    await Promise.all([mutate("/api/budget"), mutate("/api/dashboard")]);
  };

  const renameTask = async (id: string, name: string) => {
    await api(`/api/task-categories/${id}`, { method: "PATCH", body: { name } });
    setEditingTask(null);
    await mutate("/api/task-categories");
  };

  const deleteBudget = async () => {
    if (!deletingBudget) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/api/budget/categories/${deletingBudget.id}`, { method: "DELETE" });
      setDeletingBudget(null);
      await Promise.all([mutate("/api/budget"), mutate("/api/dashboard")]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't delete the category.");
    } finally {
      setBusy(false);
    }
  };

  const deleteTask = async () => {
    if (!deletingTask) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/api/task-categories/${deletingTask.id}`, { method: "DELETE" });
      setDeletingTask(null);
      await mutate("/api/task-categories");
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't delete the category.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      {error && <FieldError message={error} />}

      <Card>
        <CardHeader>
          <CardTitle>Budget categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-40 flex-1 space-y-1.5">
              <Label htmlFor="bc-name">Name</Label>
              <Input
                id="bc-name"
                value={budgetName}
                onChange={(e) => setBudgetName(e.target.value)}
                placeholder="e.g. Gifts"
              />
            </div>
            <div className="w-32 space-y-1.5">
              <Label htmlFor="bc-planned">Planned ({baseCurrency})</Label>
              <Input
                id="bc-planned"
                inputMode="decimal"
                value={budgetPlanned}
                onChange={(e) => setBudgetPlanned(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <Button
              variant="gold"
              onClick={() => void addBudget()}
              disabled={busy || !budgetName.trim()}
            >
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
          <ul className="divide-y divide-sand">
            {budgetCategories.map((c) => (
              <li key={c.id} className="flex items-center gap-3 py-2.5">
                {editingBudget === c.id ? (
                  <RenameRow
                    initial={c.name}
                    onSave={(name) => renameBudget(c.id, name)}
                    onCancel={() => setEditingBudget(null)}
                  />
                ) : (
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-charcoal">{c.name}</p>
                    <p className="text-xs text-stone-warm">
                      Planned {formatMinor(c.plannedMinor, baseCurrency)}
                      {c.expenseCount !== undefined
                        ? ` · ${c.expenseCount} expense${c.expenseCount === 1 ? "" : "s"}`
                        : ""}
                    </p>
                  </div>
                )}
                {editingBudget !== c.id && (
                  <div className="flex items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Rename ${c.name}`}
                      onClick={() => setEditingBudget(c.id)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={
                        (c.expenseCount ?? 0) > 0
                          ? `${c.name} is in use and cannot be deleted`
                          : `Delete ${c.name}`
                      }
                      disabled={(c.expenseCount ?? 0) > 0}
                      title={
                        (c.expenseCount ?? 0) > 0
                          ? "Move or remove its expenses first"
                          : undefined
                      }
                      onClick={() => setDeletingBudget(c)}
                    >
                      {(c.expenseCount ?? 0) > 0 ? (
                        <Lock className="h-3.5 w-3.5 text-stone-warm/60" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5 text-red-700" />
                      )}
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Task categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="tc-name">Name</Label>
              <Input
                id="tc-name"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                placeholder="e.g. Registry"
              />
            </div>
            <Button
              variant="gold"
              onClick={() => void addTask()}
              disabled={busy || !taskName.trim()}
            >
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
          <ul className="divide-y divide-sand">
            {taskCategories.map((c) => (
              <li key={c.id} className="flex items-center gap-3 py-2.5">
                {editingTask === c.id ? (
                  <RenameRow
                    initial={c.name}
                    onSave={(name) => renameTask(c.id, name)}
                    onCancel={() => setEditingTask(null)}
                  />
                ) : (
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-charcoal">{c.name}</p>
                    <p className="text-xs text-stone-warm">
                      {c.taskCount !== undefined
                        ? `${c.taskCount} task${c.taskCount === 1 ? "" : "s"}`
                        : ""}
                    </p>
                  </div>
                )}
                {editingTask !== c.id && (
                  <div className="flex items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Rename ${c.name}`}
                      onClick={() => setEditingTask(c.id)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={
                        (c.taskCount ?? 0) > 0
                          ? `${c.name} is in use and cannot be deleted`
                          : `Delete ${c.name}`
                      }
                      disabled={(c.taskCount ?? 0) > 0}
                      title={
                        (c.taskCount ?? 0) > 0
                          ? "Move or remove its tasks first"
                          : undefined
                      }
                      onClick={() => setDeletingTask(c)}
                    >
                      {(c.taskCount ?? 0) > 0 ? (
                        <Lock className="h-3.5 w-3.5 text-stone-warm/60" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5 text-red-700" />
                      )}
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deletingBudget !== null}
        onOpenChange={(open) => !open && setDeletingBudget(null)}
        title="Delete category?"
        description={`"${deletingBudget?.name}" will be removed. Expenses in it keep existing but lose this category — it can only be deleted while unused.`}
        busy={busy}
        onConfirm={() => void deleteBudget()}
      />
      <ConfirmDialog
        open={deletingTask !== null}
        onOpenChange={(open) => !open && setDeletingTask(null)}
        title="Delete category?"
        description={`"${deletingTask?.name}" will be removed. It can only be deleted while unused.`}
        busy={busy}
        onConfirm={() => void deleteTask()}
      />
    </div>
  );
}
