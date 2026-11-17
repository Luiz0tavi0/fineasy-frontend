import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { logoutAction } from "@/actions/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
export const instant = false;

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const c = await cookies();
  if (!c.get("fe_access")?.value) redirect("/login");
  return <div className="min-h-dvh md:flex"><aside className="border-b bg-white p-4 md:w-60 md:shrink-0 md:border-b-0 md:border-r"><div className="mb-4 flex items-center justify-between"><strong>FinEasy</strong><form action={logoutAction}><button className="text-sm underline" type="submit">Sair</button></form></div><Sidebar /></aside><main className="w-full p-4 pb-24 md:p-8">{children}</main><BottomNav /></div>;
}
