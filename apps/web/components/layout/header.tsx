"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Bell, Search, Plus, LogOut, Sparkles, UserRound } from "lucide-react";
import type { Notification } from "@wedding/shared";
import { api, swrFetcher } from "@/lib/api";
import { useAuth } from "@/contexts/auth";
import { useWedding } from "@/contexts/wedding";
import { relativeTime } from "@/lib/format";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SearchDialog } from "./search-dialog";
import { QuickAdd } from "./quick-add";

export function Header() {
  const { user, logout } = useAuth();
  const { wedding } = useWedding();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const [prefsOn, setPrefsOn] = useState(true);

  useEffect(() => {
    const readPref = () =>
      setPrefsOn(window.localStorage.getItem("wp:inapp-notifications") !== "off");
    readPref();
    window.addEventListener("wp:notif-prefs-changed", readPref);
    return () => window.removeEventListener("wp:notif-prefs-changed", readPref);
  }, []);

  const { data: notifData, mutate: mutateNotifs } = useSWR<{
    notifications: Notification[];
    unread: number;
  }>(prefsOn ? "/api/notifications" : null, swrFetcher, { refreshInterval: 60_000 });

  const unread = prefsOn ? (notifData?.unread ?? 0) : 0;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const markAllRead = async () => {
    await api("/api/notifications/read-all", { method: "POST" });
    void mutateNotifs();
  };

  const initials = useMemo(() => {
    const name = user?.displayName ?? "?";
    return name
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }, [user]);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-sand bg-cream/90 px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-2 lg:hidden">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold text-white">
          <Sparkles className="h-4 w-4" />
        </div>
        <span className="font-display text-sm font-semibold text-charcoal">
          {wedding?.weddingName ?? "Wedding Planner"}
        </span>
      </div>
      <div className="hidden lg:block" />

      <div className="flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Search"
          onClick={() => setSearchOpen(true)}
          title="Search (/)"
        >
          <Search className="h-4 w-4" />
        </Button>

        <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={`Notifications (${unread} unread)`}>
              <span className="relative">
                <Bell className="h-4 w-4" />
                {unread > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose px-1 text-[9px] font-bold text-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              Notifications
              {unread > 0 && (
                <button
                  className="text-xs font-normal normal-case text-gold hover:underline"
                  onClick={markAllRead}
                >
                  Mark all read
                </button>
              )}
            </DropdownMenuLabel>
            <div className="max-h-96 overflow-y-auto">
              {(notifData?.notifications ?? []).length === 0 && (
                <p className="px-3 py-8 text-center text-sm text-stone-warm">
                  Nothing here yet. We'll let you know when something needs attention.
                </p>
              )}
              {(notifData?.notifications ?? []).slice(0, 20).map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "border-t border-sand px-3 py-2.5",
                    !n.read && "bg-blush/40",
                  )}
                >
                  <p className="text-sm font-medium text-charcoal">{n.title}</p>
                  <p className="text-xs text-stone-warm">
                    {n.message} · {relativeTime(n.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-label="Profile menu"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-soft text-xs font-bold text-charcoal hover:ring-2 hover:ring-gold"
            >
              {initials}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>
              {user?.displayName ?? "Profile"}
              <span className="block text-[11px] font-normal normal-case text-stone-warm">
                {user?.email}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <UserRound className="h-4 w-4" /> Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => void logout()}>
              <LogOut className="h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="hidden sm:flex">
          <QuickAdd variant="default" size="sm">
            <Plus className="h-4 w-4" /> Add
          </QuickAdd>
        </div>
      </div>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}
