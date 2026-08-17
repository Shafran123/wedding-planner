"use client";

import Link from "next/link";
import useSWR from "swr";
import {
  Wallet,
  CheckSquare,
  TrendingUp,
  CalendarClock,
  ArrowRight,
  Lightbulb,
  PartyPopper,
} from "lucide-react";
import type { DashboardData } from "@wedding/shared";
import { swrFetcher } from "@/lib/api";
import { formatMinor, formatDate, relativeDue, relativeTime } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageLoader } from "@/components/ui/empty";
import { ErrorState } from "@/components/ui/empty";
import { StatCard, PageHeader } from "@/components/shared/page";
import { ProgressBar } from "@/components/shared/progress-bar";
import { CountdownCard } from "@/components/shared/countdown";
import { BudgetDonut } from "@/components/shared/budget-donut";
import { PriorityBadge } from "@/components/shared/badges";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/contexts/auth";

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, error, isLoading, mutate } = useSWR<{ dashboard: DashboardData }>(
    "/api/dashboard",
    swrFetcher,
    { refreshInterval: 30_000 },
  );

  if (isLoading) return <PageLoader />;
  if (error || !data) {
    return (
      <ErrorState
        message="We couldn't load your dashboard."
        onRetry={() => void mutate()}
      />
    );
  }

  const d = data.dashboard;
  const currency = d.wedding.currency;
  const firstName = d.wedding.partnerOneName.split(" ")[0] ?? user?.displayName ?? "";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const alertLevel = d.budget.alerts.at(-1)?.level;
  const overspent = d.categorySpend.filter((c) => c.overspentByMinor > 0);

  return (
    <div className="space-y-8">
      <PageHeader
        title={`${greeting}, ${firstName} ❤️`}
        description={`${d.wedding.weddingName} · ${formatDate(d.wedding.weddingDate)}`}
      />

      <CountdownCard weddingDate={d.wedding.weddingDate} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Budget"
          value={
            <Link href="/budget" className="hover:text-gold">
              {formatMinor(d.budget.paidMinor, currency)}
            </Link>
          }
          sub={`of ${formatMinor(d.budget.totalBudgetMinor, currency)} · ${Math.round(d.budget.percentUsed)}% used`}
          icon={Wallet}
          accent={alertLevel === "exceeded" ? "red" : alertLevel === "critical" ? "red" : alertLevel === "warning" ? "blue" : "gold"}
        />
        <StatCard
          label="Tasks"
          value={
            <Link href="/tasks" className="hover:text-gold">
              {d.taskStats.completed} / {d.taskStats.total}
            </Link>
          }
          sub={`${d.taskStats.overdue} overdue`}
          icon={CheckSquare}
          accent={d.taskStats.overdue > 0 ? "red" : "green"}
        />
        <StatCard
          label="Progress"
          value={`${Math.round(d.progress.percent)}%`}
          sub="planning complete"
          icon={TrendingUp}
          accent="rose"
        />
        <StatCard
          label="Upcoming"
          value={d.taskStats.dueThisWeek}
          sub="deadlines this week"
          icon={CalendarClock}
          accent="blue"
        />
      </div>

      {(alertLevel || overspent.length > 0) && (
        <div className="space-y-2">
          {d.budget.alerts.map((a, i) => (
            <Alert
              key={i}
              variant={a.level === "exceeded" ? "critical" : a.level === "critical" ? "critical" : "warning"}
            >
              <AlertTitle>{a.message}</AlertTitle>
              <Link href="/budget" className="text-xs font-medium underline underline-offset-2">
                Review your budget
              </Link>
            </Alert>
          ))}
          {overspent.map((c) => (
            <Alert key={c.categoryId} variant="critical">
              <AlertTitle>
                {c.name} is over budget by {formatMinor(c.overspentByMinor, currency)}
              </AlertTitle>
              <span className="text-xs">
                Planned {formatMinor(c.plannedMinor, currency)}, spent {formatMinor(c.spentMinor, currency)}.
              </span>
            </Alert>
          ))}
        </div>
      )}

      {d.insights.length > 0 && (
        <Card className="border-gold-soft bg-white">
          <CardContent className="space-y-2 p-4">
            {d.insights.map((insight, i) => (
              <Link
                key={i}
                href={insight.actionUrl ?? "#"}
                className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm text-charcoal hover:bg-parchment"
              >
                <Lightbulb className="h-4 w-4 shrink-0 text-gold" aria-hidden />
                {insight.message}
                <ArrowRight className="ml-auto h-3.5 w-3.5 shrink-0 text-stone-warm" aria-hidden />
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Upcoming tasks</CardTitle>
            <Link href="/tasks" className="text-xs font-medium text-gold hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {d.upcomingTasks.length === 0 ? (
              <p className="py-8 text-center text-sm text-stone-warm">
                Nothing due — enjoy the calm. ✨
              </p>
            ) : (
              <ul className="divide-y divide-sand">
                {d.upcomingTasks.map((task) => (
                  <li key={task.id}>
                    <Link
                      href={`/tasks/${task.id}`}
                      className="flex items-center gap-3 py-2.5 hover:bg-parchment/60"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-charcoal">{task.title}</p>
                        <p className="text-xs text-stone-warm">{task.categoryName ?? "Other"}</p>
                      </div>
                      <PriorityBadge priority={task.priority} />
                      <span className="w-24 text-right text-xs text-stone-warm">
                        {relativeDue(task.dueDate)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Budget overview</CardTitle>
            <Link href="/budget" className="text-xs font-medium text-gold hover:underline">
              Manage
            </Link>
          </CardHeader>
          <CardContent>
            <BudgetDonut data={d.categorySpend} currency={currency} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Planning progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {d.progress.byCategory.length === 0 ? (
              <p className="py-6 text-center text-sm text-stone-warm">
                Complete a few tasks and progress will appear here.
              </p>
            ) : (
              d.progress.byCategory.slice(0, 7).map((c) => (
                <div key={c.categoryId}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium text-charcoal">{c.name}</span>
                    <span className="tabular-nums text-stone-warm">
                      {Math.round(c.percent)}% · {c.completed}/{c.total}
                    </span>
                  </div>
                  <ProgressBar percent={c.percent} />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Upcoming events</CardTitle>
              <Link href="/events" className="text-xs font-medium text-gold hover:underline">
                View all
              </Link>
            </CardHeader>
            <CardContent>
              {d.upcomingEvents.length === 0 ? (
                <p className="py-6 text-center text-sm text-stone-warm">
                  No upcoming events yet.
                </p>
              ) : (
                <ul className="divide-y divide-sand">
                  {d.upcomingEvents.map((event) => (
                    <li key={event.id}>
                      <Link
                        href={`/events/${event.id}`}
                        className="flex items-center gap-3 py-2.5 hover:bg-parchment/60"
                      >
                        <PartyPopper className="h-4 w-4 shrink-0 text-rose" aria-hidden />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-charcoal">
                          {event.name}
                        </span>
                        <span className="text-xs text-stone-warm">{formatDate(event.date)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {d.upcomingPayments.length > 0 && (
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Payments due</CardTitle>
                <Link href="/budget/payments" className="text-xs font-medium text-gold hover:underline">
                  View all
                </Link>
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-sand">
                  {d.upcomingPayments.map((payment) => (
                    <li key={payment.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-charcoal">
                          {payment.vendorName ?? "Payment"}
                        </p>
                        <p className="text-xs text-stone-warm">{relativeDue(payment.dueDate)}</p>
                      </div>
                      <span className="tabular-nums text-sm font-semibold text-charcoal">
                        {formatMinor(payment.amountMinor, currency)}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
        </CardHeader>
        <CardContent>
          {d.recentActivity.length === 0 ? (
            <p className="py-6 text-center text-sm text-stone-warm">
              Your planning story will appear here as you go.
            </p>
          ) : (
            <ul className="divide-y divide-sand">
              {d.recentActivity.map((a) => (
                <li key={a.id} className="flex items-start gap-3 py-2.5 text-sm">
                  <Badge variant="outline" className="mt-0.5 shrink-0">
                    {a.entityType}
                  </Badge>
                  <p className="min-w-0 flex-1 text-charcoal">{a.message}</p>
                  <span className="shrink-0 text-xs text-stone-warm">
                    {relativeTime(a.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
