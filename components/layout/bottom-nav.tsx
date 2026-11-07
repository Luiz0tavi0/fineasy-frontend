// components/layout/bottom-nav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "./nav-items";
import { cn } from "@/lib/utils";

export function BottomNav({ className }: { className?: string }) {
    const pathname = usePathname();

    return (
        <nav
            className={cn(
                "grid border-t bg-white pb-[env(safe-area-inset-bottom)]",
                className,
            )}
            style={{ gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))` }}
        >
            {navItems.map((item) => {
                const active = pathname.startsWith(item.href);
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                            "flex flex-col items-center py-2 text-xs",
                            active ? "font-semibold text-zinc-900" : "text-zinc-500",
                        )}
                    >
                        {item.label}
                    </Link>
                );
            })}
        </nav>
    );
}