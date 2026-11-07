// components/layout/sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "./nav-items";
import { cn } from "@/lib/utils";

export function Sidebar({ className }: { className?: string }) {
    const pathname = usePathname();

    return (
        <aside className={cn("w-60 shrink-0 flex-col border-r bg-white p-4", className)}>
            <span className="mb-6 px-2 text-lg font-semibold">FinEasy</span>
            <nav className="flex flex-col gap-1">
                {navItems.map((item) => {
                    const active = pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            aria-current={active ? "page" : undefined}
                            className={cn(
                                "rounded-md px-3 py-2 text-sm",
                                active ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100",
                            )}
                        >
                            {item.label}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}