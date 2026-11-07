import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { logoutAction } from "@/actions/auth";
export const instant = false;

const navigation = [["/", "Dashboard"], ["/accounts", "Contas"], ["/credit-cards", "Cartões"], ["/categories", "Categorias"], ["/transactions", "Transações"], ["/purchases", "Compras"], ["/recurrences", "Recorrências"], ["/invoices", "Faturas"], ["/transfers", "Transferências"]] as const;

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const c = await cookies();
  if (!c.get("fe_access")?.value) redirect("/login");
  return <div className="min-h-dvh md:flex"><aside className="border-b bg-white p-4 md:w-60 md:border-b-0 md:border-r"><div className="mb-4 flex items-center justify-between md:block"><strong>FinEasy</strong><form action={logoutAction}><button className="text-sm underline md:mt-4" type="submit">Sair</button></form></div><nav className="flex gap-1 overflow-x-auto md:flex-col">{navigation.map(([href, label]) => <Link className="whitespace-nowrap rounded px-3 py-2 text-sm hover:bg-slate-100" href={href} key={href}>{label}</Link>)}</nav></aside><main className="w-full p-4 md:p-8">{children}</main></div>;
}
