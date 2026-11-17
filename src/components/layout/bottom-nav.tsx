import Link from "next/link";
import { navItems } from "./nav-items";

export function BottomNav() {
  return <nav aria-label="Navegação principal" className="fixed inset-x-0 bottom-0 z-30 border-t bg-white/95 p-2 backdrop-blur md:hidden">
    <div className="flex gap-1 overflow-x-auto">
      {navItems.map(({ href, label }) => <Link className="shrink-0 rounded px-3 py-2 text-xs hover:bg-slate-100" href={href} key={href}>{label}</Link>)}
    </div>
  </nav>;
}
