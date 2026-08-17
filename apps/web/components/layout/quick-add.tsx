"use client";

import { useState } from "react";
import { mutate } from "swr";
import {
  CheckSquare,
  Receipt,
  Store,
  CalendarDays,
  MapPin,
  StickyNote,
  Plus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useWedding } from "@/contexts/wedding";
import { Button, type ButtonProps } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input, Label, Select, Textarea, FieldError } from "@/components/ui/input";
import { Spinner } from "@/components/ui/empty";
import { parseToMinor } from "@/lib/money";
import {
  DEFAULT_TASK_CATEGORIES,
  VENDOR_CATEGORIES,
  LOCATION_TYPES,
} from "@wedding/shared";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type QuickKind = "task" | "expense" | "vendor" | "event" | "location" | "note";

const OPTIONS: { kind: QuickKind; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { kind: "task", label: "Task", icon: CheckSquare },
  { kind: "expense", label: "Expense", icon: Receipt },
  { kind: "vendor", label: "Vendor", icon: Store },
  { kind: "event", label: "Event", icon: CalendarDays },
  { kind: "location", label: "Location", icon: MapPin },
  { kind: "note", label: "Note", icon: StickyNote },
];

export function QuickAdd({ children, ...buttonProps }: ButtonProps & { children?: React.ReactNode }) {
  const [kind, setKind] = useState<QuickKind | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { role, wedding } = useWedding();
  const router = useRouter();

  const canFinance = role === "owner" || role === "partner";
  const canPlan = role === "owner" || role === "partner" || role === "planner";
  if (!canPlan) return null;

  const options = OPTIONS.filter((o) =>
    o.kind === "expense" ? canFinance : true,
  );

  const submit = async (path: string, body: unknown, cacheKeys: string[], redirect?: string) => {
    setBusy(true);
    setError(null);
    try {
      await api(path, { method: "POST", body });
      for (const key of cacheKeys) await mutate(key);
      setKind(null);
      if (redirect) router.push(redirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button {...buttonProps}>
            {children ?? (
              <>
                <Plus className="h-4 w-4" /> Quick add
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {options.map((o) => (
            <DropdownMenuItem key={o.kind} onSelect={() => setKind(o.kind)}>
              <o.icon className="h-4 w-4" /> {o.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={kind !== null} onOpenChange={(open) => !open && setKind(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Quick {kind ? OPTIONS.find((o) => o.kind === kind)?.label.toLowerCase() : ""}
            </DialogTitle>
          </DialogHeader>
          {error && <FieldError message={error} />}
          <QuickTask onDone={submit} busy={busy} visible={kind === "task"} />
          <QuickExpense onDone={submit} busy={busy} visible={kind === "expense"} currency={wedding?.currency ?? "AED"} />
          <QuickVendor onDone={submit} busy={busy} visible={kind === "vendor"} />
          <QuickEvent onDone={submit} busy={busy} visible={kind === "event"} />
          <QuickLocation onDone={submit} busy={busy} visible={kind === "location"} />
          <QuickNote onDone={submit} busy={busy} visible={kind === "note"} />
        </DialogContent>
      </Dialog>
    </>
  );
}

type Submit = (path: string, body: unknown, keys: string[], redirect?: string) => Promise<void>;

function QuickTask({ visible, busy, onDone }: { visible: boolean; busy: boolean; onDone: Submit }) {
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  if (!visible) return null;
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        void onDone("/api/tasks", { title, dueDate: due || undefined }, ["/api/tasks", "/api/dashboard"]);
      }}
    >
      <div className="space-y-1">
        <Label htmlFor="q-task-title">Task</Label>
        <Input id="q-task-title" required autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Book photographer" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="q-task-due">Due date</Label>
        <Input id="q-task-due" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={busy || !title.trim()}>
          {busy && <Spinner />} Add task
        </Button>
      </DialogFooter>
    </form>
  );
}

function QuickExpense({ visible, busy, onDone, currency }: { visible: boolean; busy: boolean; onDone: Submit; currency: string }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>(DEFAULT_TASK_CATEGORIES[0] ?? "Other");
  if (!visible) return null;
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const minor = parseToMinor(amount);
        if (minor === null) return;
        void onDone("/api/expenses", { name, estimatedMinor: minor }, ["/api/expenses", "/api/budget", "/api/dashboard"]);
      }}
    >
      <div className="space-y-1">
        <Label htmlFor="q-expense-name">Expense</Label>
        <Input id="q-expense-name" required autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Photographer deposit" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="q-expense-amount">Amount ({currency})</Label>
          <Input id="q-expense-amount" required inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="q-expense-category">Category</Label>
          <Select id="q-expense-category" value={category} onChange={(e) => setCategory(e.target.value)}>
            {DEFAULT_TASK_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={busy || !name.trim() || parseToMinor(amount) === null}>
          {busy && <Spinner />} Add expense
        </Button>
      </DialogFooter>
    </form>
  );
}

function QuickVendor({ visible, busy, onDone }: { visible: boolean; busy: boolean; onDone: Submit }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>(VENDOR_CATEGORIES[0]);
  if (!visible) return null;
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        void onDone("/api/vendors", { name, category }, ["/api/vendors", "/api/dashboard"]);
      }}
    >
      <div className="space-y-1">
        <Label htmlFor="q-vendor-name">Vendor</Label>
        <Input id="q-vendor-name" required autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Luminous Photography" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="q-vendor-category">Category</Label>
        <Select id="q-vendor-category" value={category} onChange={(e) => setCategory(e.target.value)}>
          {VENDOR_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={busy || !name.trim()}>
          {busy && <Spinner />} Add vendor
        </Button>
      </DialogFooter>
    </form>
  );
}

function QuickEvent({ visible, busy, onDone }: { visible: boolean; busy: boolean; onDone: Submit }) {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  if (!visible) return null;
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        void onDone("/api/events", { name, date: new Date(`${date}T12:00:00`).toISOString() }, ["/api/events", "/api/dashboard"], "/events");
      }}
    >
      <div className="space-y-1">
        <Label htmlFor="q-event-name">Event</Label>
        <Input id="q-event-name" required autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mehendi night" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="q-event-date">Date</Label>
        <Input id="q-event-date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={busy || !name.trim() || !date}>
          {busy && <Spinner />} Add event
        </Button>
      </DialogFooter>
    </form>
  );
}

function QuickLocation({ visible, busy, onDone }: { visible: boolean; busy: boolean; onDone: Submit }) {
  const [name, setName] = useState("");
  const [type, setType] = useState<string>(LOCATION_TYPES[0]);
  if (!visible) return null;
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        void onDone("/api/locations", { name, type }, ["/api/locations", "/api/dashboard"]);
      }}
    >
      <div className="space-y-1">
        <Label htmlFor="q-location-name">Location</Label>
        <Input id="q-location-name" required autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Palm Garden Hall" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="q-location-type">Type</Label>
        <Select id="q-location-type" value={type} onChange={(e) => setType(e.target.value)}>
          {LOCATION_TYPES.map((t) => (
            <option key={t} value={t}>{t.replace("_", " ")}</option>
          ))}
        </Select>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={busy || !name.trim()}>
          {busy && <Spinner />} Add location
        </Button>
      </DialogFooter>
    </form>
  );
}

function QuickNote({ visible, busy, onDone }: { visible: boolean; busy: boolean; onDone: Submit }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  if (!visible) return null;
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        void onDone("/api/notes", { title, content, category: "general" }, ["/api/notes", "/api/dashboard"]);
      }}
    >
      <div className="space-y-1">
        <Label htmlFor="q-note-title">Title</Label>
        <Input id="q-note-title" required autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Cake ideas" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="q-note-content">Note</Label>
        <Textarea id="q-note-content" value={content} onChange={(e) => setContent(e.target.value)} />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={busy || !title.trim()}>
          {busy && <Spinner />} Add note
        </Button>
      </DialogFooter>
    </form>
  );
}
