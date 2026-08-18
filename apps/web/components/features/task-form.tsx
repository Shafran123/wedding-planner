"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { taskSchema, type Task, type TaskCategory } from "@wedding/shared";
import { api, swrFetcher } from "@/lib/api";
import { parseToMinor } from "@/lib/money";
import { MoneyInput } from "@/components/shared/money-input";
import { useWedding } from "@/contexts/wedding";
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
import { TASK_PRIORITIES, TASK_STATUSES } from "@wedding/shared";
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from "@/lib/labels";

const formSchema = taskSchema
  .omit({ currency: true, rate: true })
  .extend({
    estimatedCostInput: z.string().optional(),
    actualCostInput: z.string().optional(),
    currency: z.string().optional(),
    rate: z.string().optional(),
  });
type FormValues = z.input<typeof formSchema>;

export function TaskFormDialog({
  open,
  onOpenChange,
  task,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task;
  onSaved: () => void;
}) {
  const { data: categoryData } = useSWR<{ categories: TaskCategory[] }>(
    open ? "/api/task-categories" : null,
    swrFetcher,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { wedding } = useWedding();
  const baseCurrency = wedding?.currency ?? "AED";
  const fallbackRate = wedding?.rates?.["LKR"];

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      categoryId: "",
      status: "todo",
      priority: "medium",
      dueDate: "",
      assignedTo: "",
      estimatedCostInput: "",
      actualCostInput: "",
      currency: "AED",
      rate: "",
      vendorId: "",
      eventId: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        title: task?.title ?? "",
        description: task?.description ?? "",
        categoryId: task?.categoryId ?? "",
        status: task?.status ?? "todo",
        priority: task?.priority ?? "medium",
        dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : "",
        assignedTo: task?.assignedTo ?? "",
        estimatedCostInput: task?.estimatedCostMinor !== undefined ? String(task.estimatedCostMinor / 100) : "",
        actualCostInput: task?.actualCostMinor !== undefined ? String(task.actualCostMinor / 100) : "",
        currency: task?.currency ?? baseCurrency,
        rate:
          task && task.currency && task.currency !== baseCurrency
            ? String(task.rate ?? "")
            : "",
        vendorId: task?.vendorId ?? "",
        eventId: task?.eventId ?? "",
      });
      setError(null);
    }
  }, [open, task, reset, baseCurrency]);

  const onSubmit = async (values: FormValues) => {
    setBusy(true);
    setError(null);
    try {
      const currency = values.currency || baseCurrency;
      const rate = currency !== baseCurrency ? Number(values.rate) : undefined;
      const hasMoney =
        (values.estimatedCostInput ?? "") !== "" || (values.actualCostInput ?? "") !== "";
      if (hasMoney && currency !== baseCurrency && (rate === undefined || !Number.isFinite(rate) || rate <= 0)) {
        setError(`Enter an exchange rate to convert ${currency} to ${baseCurrency}.`);
        return;
      }
      const body = {
        ...values,
        estimatedCostMinor: parseToMinor(values.estimatedCostInput ?? "") ?? undefined,
        actualCostMinor: parseToMinor(values.actualCostInput ?? "") ?? undefined,
        currency,
        rate: rate ?? undefined,
      };
      delete (body as Record<string, unknown>).estimatedCostInput;
      delete (body as Record<string, unknown>).actualCostInput;
      if (task) {
        await api(`/api/tasks/${task.id}`, { method: "PATCH", body });
      } else {
        await api("/api/tasks", { method: "POST", body });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't save this task.");
    } finally {
      setBusy(false);
    }
  };

  const categoryOptions = useMemo(
    () => categoryData?.categories ?? [],
    [categoryData],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{task ? "Edit task" : "New task"}</DialogTitle>
          <DialogDescription>
            {task ? "Update the details of this task." : "Add a task to your wedding plan."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="t-title">Title</Label>
            <Input id="t-title" autoFocus {...register("title")} />
            <FieldError message={errors.title?.message} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="t-description">Description</Label>
            <Textarea id="t-description" rows={2} {...register("description")} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="t-category">Category</Label>
              <Select id="t-category" {...register("categoryId")}>
                <option value="">None</option>
                {categoryOptions.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-status">Status</Label>
              <Select id="t-status" {...register("status")}>
                {TASK_STATUSES.map((s) => (
                  <option key={s} value={s}>{TASK_STATUS_LABELS[s]}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-priority">Priority</Label>
              <Select id="t-priority" {...register("priority")}>
                {TASK_PRIORITIES.map((p) => (
                  <option key={p} value={p}>{TASK_PRIORITY_LABELS[p]}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-due">Due date</Label>
              <Input id="t-due" type="date" {...register("dueDate")} />
            </div>
            <MoneyInput
              register={register}
              watch={watch}
              setValue={setValue}
              errors={errors}
              amountField="estimatedCostInput"
              amountId="t-estimated"
              label="Estimated cost"
              baseCurrency={baseCurrency}
              fallbackRate={fallbackRate}
            />
            <MoneyInput
              register={register}
              watch={watch}
              setValue={setValue}
              errors={errors}
              amountField="actualCostInput"
              amountId="t-actual"
              label="Actual cost"
              baseCurrency={baseCurrency}
              fallbackRate={fallbackRate}
              primary={false}
            />
          </div>
          {error && <FieldError message={error} />}
          <DialogFooter>
            <Button type="submit" disabled={busy}>
              {busy && <Spinner />} {task ? "Save changes" : "Create task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
