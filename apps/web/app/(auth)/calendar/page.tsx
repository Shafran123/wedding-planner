"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import {
  addMonths,
  format,
  startOfMonth,
  startOfWeek,
  endOfWeek,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,

  isToday as isTodayFn,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, CheckSquare, CreditCard, CalendarDays, Store, MapPin } from "lucide-react";
import type { Event, Payment, Task, Vendor, Location } from "@wedding/shared";
import { swrFetcher } from "@/lib/api";
import { PageHeader } from "@/components/shared/page";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { PageLoader, ErrorState } from "@/components/ui/empty";
import { cn } from "@/lib/utils";

type ItemKind = "task" | "payment" | "event" | "appointment" | "visit";
interface CalendarItem {
  id: string;
  kind: ItemKind;
  title: string;
  date: string;
  href: string;
}

const KIND_STYLES: Record<ItemKind, { dot: string; label: string; icon: React.ComponentType<{ className?: string }> }> = {
  task: { dot: "bg-gold", label: "Tasks", icon: CheckSquare },
  payment: { dot: "bg-rose", label: "Payments", icon: CreditCard },
  event: { dot: "bg-emerald-600", label: "Events", icon: CalendarDays },
  appointment: { dot: "bg-sky-500", label: "Vendor meetings", icon: Store },
  visit: { dot: "bg-violet-500", label: "Venue visits", icon: MapPin },
};

export default function CalendarPage() {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [view, setView] = useState<"month" | "agenda">("month");
  const [filters, setFilters] = useState<Record<ItemKind, boolean>>({
    task: true,
    payment: true,
    event: true,
    appointment: true,
    visit: true,
  });

  const { data: taskData, error: taskError, isLoading: taskLoading } = useSWR<{ tasks: Task[] }>("/api/tasks", swrFetcher);
  const { data: paymentData, error: paymentError, isLoading: paymentLoading } = useSWR<{ payments: Payment[] }>("/api/payments", swrFetcher);
  const { data: eventData, error: eventError, isLoading: eventLoading } = useSWR<{ events: Event[] }>("/api/events", swrFetcher);
  const { data: vendorData, error: vendorError, isLoading: vendorLoading } = useSWR<{ vendors: Vendor[] }>("/api/vendors", swrFetcher);
  const { data: locationData, error: locationError, isLoading: locationLoading } = useSWR<{ locations: Location[] }>("/api/locations", swrFetcher);

  const isLoading = taskLoading || paymentLoading || eventLoading || vendorLoading || locationLoading;
  const error = taskError ?? paymentError ?? eventError ?? vendorError ?? locationError;

  const items = useMemo<CalendarItem[]>(() => {
    const list: CalendarItem[] = [];
    if (filters.task) {
      for (const t of taskData?.tasks ?? []) {
        if (t.dueDate) list.push({ id: t.id, kind: "task", title: t.title, date: t.dueDate, href: `/tasks/${t.id}` });
      }
    }
    if (filters.payment) {
      for (const p of paymentData?.payments ?? []) {
        if (p.dueDate) list.push({ id: p.id, kind: "payment", title: p.vendorName ?? p.expenseName ?? "Payment", date: p.dueDate, href: "/budget/payments" });
      }
    }
    if (filters.event) {
      for (const e of eventData?.events ?? []) {
        list.push({ id: e.id, kind: "event", title: e.name, date: e.date, href: `/events/${e.id}` });
      }
    }
    if (filters.appointment) {
      for (const v of vendorData?.vendors ?? []) {
        if (v.meetingDate) list.push({ id: v.id, kind: "appointment", title: `Meeting: ${v.name}`, date: v.meetingDate, href: `/vendors/${v.id}` });
      }
    }
    if (filters.visit) {
      for (const l of locationData?.locations ?? []) {
        if (l.visitDate) list.push({ id: l.id, kind: "visit", title: `Visit: ${l.name}`, date: l.visitDate, href: `/locations/${l.id}` });
      }
    }
    return list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [taskData, paymentData, eventData, vendorData, locationData, filters]);

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    for (const item of items) {
      const key = item.date.slice(0, 10);
      const existing = map.get(key) ?? [];
      existing.push(item);
      map.set(key, existing);
    }
    return map;
  }, [items]);

  if (isLoading) return <PageLoader />;
  if (error) return <ErrorState message="We couldn't load the calendar." />;

  const gridDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), { weekStartsOn: 0 }),
    end: endOfWeek(endOfMonth(month), { weekStartsOn: 0 }),
  });

  const agendaItems = view === "agenda" ? items : [];

  return (
    <div>
      <PageHeader title="Calendar" description="Your whole plan — tasks, payments and events — on one calendar." />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Tabs value={view} onValueChange={(v) => setView(v as "month" | "agenda")}>
          <TabsList>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="agenda">Agenda</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(KIND_STYLES) as ItemKind[]).map((kind) => (
            <label key={kind} className="flex cursor-pointer items-center gap-1.5 rounded-full border border-sand bg-white px-3 py-1.5 text-xs font-medium text-charcoal">
              <input
                type="checkbox"
                checked={filters[kind]}
                onChange={() => setFilters((f) => ({ ...f, [kind]: !f[kind] }))}
                className="h-3.5 w-3.5 accent-[#b3924e]"
              />
              <span className={cn("h-2 w-2 rounded-full", KIND_STYLES[kind].dot)} aria-hidden />
              {KIND_STYLES[kind].label}
            </label>
          ))}
        </div>
      </div>

      {view === "month" && (
        <Card className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-charcoal">
              {format(month, "MMMM yyyy")}
            </h2>
            <div className="flex gap-1">
              <Button variant="outline" size="icon" aria-label="Previous month" onClick={() => setMonth((m) => subMonths(m, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" aria-label="Next month" onClick={() => setMonth((m) => addMonths(m, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase tracking-wider text-stone-warm">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {gridDays.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const dayItems = byDay.get(key) ?? [];
              const today = isTodayFn(day);
              return (
                <div
                  key={key}
                  className={cn(
                    "min-h-24 rounded-lg border p-1.5 text-left align-top",
                    isSameMonth(day, month) ? "border-sand bg-white" : "border-transparent bg-parchment/40 opacity-60",
                    today && "border-gold bg-gold-soft/20",
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                      today ? "bg-gold text-white" : "text-stone-warm",
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {dayItems.slice(0, 3).map((item) => (
                      <Link
                        key={`${item.kind}-${item.id}`}
                        href={item.href}
                        className="flex items-center gap-1 truncate rounded px-1 py-0.5 text-[10px] font-medium text-charcoal hover:bg-parchment"
                      >
                        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", KIND_STYLES[item.kind].dot)} aria-hidden />
                        <span className="truncate">{item.title}</span>
                      </Link>
                    ))}
                    {dayItems.length > 3 && (
                      <p className="px-1 text-[10px] text-stone-warm">+{dayItems.length - 3} more</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {view === "agenda" && (
        <Card className="p-4">
          {agendaItems.length === 0 ? (
            <p className="py-10 text-center text-sm text-stone-warm">Nothing scheduled in this view.</p>
          ) : (
            <ul className="divide-y divide-sand">
              {agendaItems.map((item) => (
                <li key={`${item.kind}-${item.id}`}>
                  <Link href={item.href} className="flex items-center gap-3 py-3 hover:bg-parchment/50">
                    <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", KIND_STYLES[item.kind].dot)} aria-hidden />
                    <span className="w-28 shrink-0 text-sm font-medium text-charcoal">
                      {format(new Date(item.date), "d MMM")}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-charcoal">{item.title}</span>
                    <span className="shrink-0 text-xs uppercase tracking-wider text-stone-warm">
                      {KIND_STYLES[item.kind].label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}
