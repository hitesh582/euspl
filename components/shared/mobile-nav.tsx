"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { navItems } from "./sidebar";

export function MobileNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const allowedItems = navItems.filter((i) => i.roles.includes(user?.role || ""));

  return (
    <div className="md:hidden fixed bottom-0 w-full z-50 bg-background border-t border-border flex items-center justify-start sm:justify-around overflow-x-auto px-2 pt-2 pb-6 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {allowedItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/dashboard" && item.href !== "/attendance" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center p-2 shrink-0 min-w-[76px] sm:flex-1 gap-1.5 transition-colors",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div className={cn("flex items-center justify-center rounded-full transition-transform", isActive ? "scale-110" : "")}>{item.icon}</div>
            <span className="text-[10px] font-semibold leading-none">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
