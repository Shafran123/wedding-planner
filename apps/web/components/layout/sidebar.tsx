"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  Wallet,
  Store,
  MapPin,
  CalendarDays,
  Calendar as CalendarIcon,
  StickyNote,
  Settings,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWedding } from "@/contexts/wedding";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/budget", label: "Budget", icon: Wallet },
  { href: "/vendors", label: "Vendors", icon: Store },
  { href: "/locations", label: "Locations", icon: MapPin },
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/calendar", label: "Calendar", icon: CalendarIcon },
  { href: "/notes", label: "Notes", icon: StickyNote },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const { wedding } = useWedding();
  const weddingName = wedding?.weddingName ?? "Wedding Planner";
  return (
    <aside
      className={cn(
        "hidden w-60 shrink-0 flex-col border-r border-sand bg-white lg:flex",
        className,
      )}
    >
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold text-white">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="font-display text-sm font-semibold leading-tight text-charcoal">
            Wedding Planner
          </p>
          <p className="truncate text-xs text-stone-warm">{weddingName}</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-2" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-charcoal text-cream"
                  : "text-stone-warm hover:bg-parchment hover:text-charcoal",
              )}
              aria-current={active ? "page" : undefined}
            >
              <item.icon className="h-4 w-4" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sand px-5 py-4">
        <p className="text-xs text-stone-warm">Plan your wedding. Enjoy the journey.</p>
      </div>
    </aside>
  );
}
