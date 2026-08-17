"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./sidebar";

export function MobileNav() {
  const pathname = usePathname();
  const primary = NAV_ITEMS.slice(0, 5);
  const overflow = NAV_ITEMS.slice(5);
  const isOverflow = overflow.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-sand bg-white/95 backdrop-blur lg:hidden"
      aria-label="Mobile navigation"
    >
      {primary.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium",
              active ? "text-charcoal" : "text-stone-warm",
            )}
            aria-current={active ? "page" : undefined}
          >
            <item.icon className="h-5 w-5" aria-hidden />
            {item.label}
          </Link>
        );
      })}
      <Link
        href={isOverflow ? "/settings" : "/calendar"}
        className={cn(
          "flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium",
          isOverflow ? "text-charcoal" : "text-stone-warm",
        )}
      >
        <Settings className="h-5 w-5" aria-hidden />
        More
      </Link>
    </nav>
  );
}
