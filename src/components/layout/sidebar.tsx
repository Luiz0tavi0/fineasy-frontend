import Link from "next/link";
import { navItems } from "./nav-items";

export function Sidebar() {
  return <nav aria-label="Navegação principal" className="hidden gap-1 md:flex md:flex-col">
    {navItems.map(({ href, label }) => <Link className="rounded-md px-3 py-2 text-sm hover:bg-slate-100" href={href} key={href}>{label}</Link>)}
  </nav>;
}
