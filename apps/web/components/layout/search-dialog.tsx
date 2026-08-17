"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckSquare,
  Receipt,
  Store,
  CalendarDays,
  MapPin,
  StickyNote,
  Search,
} from "lucide-react";
import type { Task, Expense, Vendor, Event, Location, Note } from "@wedding/shared";
import { api } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { relativeDue, formatMinor } from "@/lib/format";
import { Spinner } from "@/components/ui/empty";

interface SearchIndex {
  tasks: Task[];
  vendors: Vendor[];
  locations: Location[];
  events: Event[];
  notes: Note[];
  expenses: Expense[];
}

interface Group {
  key: keyof SearchIndex;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const GROUPS: Group[] = [
  { key: "tasks", label: "Tasks", icon: CheckSquare },
  { key: "vendors", label: "Vendors", icon: Store },
  { key: "locations", label: "Locations", icon: MapPin },
  { key: "events", label: "Events", icon: CalendarDays },
  { key: "notes", label: "Notes", icon: StickyNote },
  { key: "expenses", label: "Expenses", icon: Receipt },
];

export function SearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState<SearchIndex | null>(null);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const [tasks, vendors, locations, events, notes, expenses] = await Promise.all([
          api<{ tasks: Task[] }>("/api/tasks"),
          api<{ vendors: Vendor[] }>("/api/vendors"),
          api<{ locations: Location[] }>("/api/locations"),
          api<{ events: Event[] }>("/api/events"),
          api<{ notes: Note[] }>("/api/notes"),
          api<{ expenses: Expense[] }>("/api/expenses"),
        ]);
        if (!cancelled) {
          setIndex({
            tasks: tasks.tasks,
            vendors: vendors.vendors,
            locations: locations.locations,
            events: events.events,
            notes: notes.notes,
            expenses: expenses.expenses,
          });
        }
      } catch {
        if (!cancelled) setIndex({ tasks: [], vendors: [], locations: [], events: [], notes: [], expenses: [] });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const results = useMemo(() => {
    if (!index || query.trim().length < 2) return null;
    const q = query.trim().toLowerCase();
    const match = (text: string | undefined) => (text ?? "").toLowerCase().includes(q);
    return {
      tasks: index.tasks.filter((t) => match(t.title)),
      vendors: index.vendors.filter((v) => match(v.name) || match(v.category)),
      locations: index.locations.filter((l) => match(l.name) || match(l.address)),
      events: index.events.filter((e) => match(e.name)),
      notes: index.notes.filter((n) => match(n.title) || match(n.content)),
      expenses: index.expenses.filter((e) => match(e.name)),
    };
  }, [index, query]);

  const total = results
    ? Object.values(results).reduce((sum, list) => sum + list.length, 0)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Search your wedding</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-stone-warm" aria-hidden />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks, vendors, notes, expenses…"
            className="pl-9"
            aria-label="Search"
          />
        </div>
        <div className="mt-4 max-h-[50vh] overflow-y-auto">
          {!index && <div className="flex justify-center py-6"><Spinner className="h-5 w-5 text-gold" /></div>}
          {index && query.trim().length < 2 && (
            <p className="py-6 text-center text-sm text-stone-warm">
              Type at least 2 characters to search.
            </p>
          )}
          {results && total === 0 && (
            <p className="py-6 text-center text-sm text-stone-warm">
              No results for “{query}”.
            </p>
          )}
          {results &&
            GROUPS.map((group) => {
              const items = results[group.key];
              if (items.length === 0) return null;
              return (
                <div key={group.key} className="mb-4">
                  <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-stone-warm">
                    <group.icon className="h-3.5 w-3.5" /> {group.label}
                  </p>
                  <ul className="space-y-0.5">
                    {items.slice(0, 6).map((item) => {
                      const href =
                        group.key === "tasks"
                          ? `/tasks/${item.id}`
                          : group.key === "expenses"
                            ? "/budget"
                            : `/${group.key}/${item.id}`;
                      const sub =
                        group.key === "tasks"
                          ? relativeDue((item as Task).dueDate)
                          : group.key === "expenses"
                            ? formatMinor((item as Expense).estimatedMinor)
                            : group.key === "events"
                              ? new Date((item as Event).date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                              : group.key === "notes"
                                ? (item as Note).category
                                : ((item as Vendor).address ??
                                  (item as Vendor).category ??
                                  (item as Location).type);
                      const name = (item as { name?: string }).name ?? (item as { title?: string }).title;
                      return (
                        <li key={item.id}>
                          <Link
                            href={href}
                            onClick={() => onOpenChange(false)}
                            className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 hover:bg-parchment"
                          >
                            <span className="truncate text-sm font-medium text-charcoal">
                              {name}
                            </span>
                            <span className="shrink-0 text-xs text-stone-warm">{sub}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
