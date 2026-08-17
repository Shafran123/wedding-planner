"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden flex-1 flex-col justify-between bg-charcoal p-10 text-cream lg:flex">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="font-display text-lg font-semibold">Wedding Planner</span>
        </Link>
        <div>
          <h1 className="font-display text-4xl font-semibold leading-tight">
            Plan your wedding.
            <br />
            Without the chaos.
          </h1>
          <p className="mt-4 max-w-md text-cream/70">
            Everything you need to plan your perfect day, in one beautiful place —
            budgets, tasks, vendors, locations, events and notes.
          </p>
        </div>
        <p className="text-sm text-cream/50">
          Plan your wedding. Track every detail. Enjoy the journey.
        </p>
      </div>
      <div className="flex flex-1 items-center justify-center bg-cream px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-display text-lg font-semibold">Wedding Planner</span>
          </div>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-charcoal">
            {title}
          </h2>
          <p className="mt-1.5 text-sm text-stone-warm">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
