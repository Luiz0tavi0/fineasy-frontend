"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui";

export default function AppError({
  error,
  retry,
}: Readonly<{ error: Error & { digest?: string }; retry: () => void }>) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <main className="mx-auto max-w-xl rounded-xl border bg-white p-8 text-center">
    <h1 className="text-xl font-semibold">Não foi possível carregar esta página</h1>
    <p className="mt-2 text-sm text-slate-600">Ocorreu um erro ao buscar os dados. Tente novamente.</p>
    <Button className="mt-5" onClick={retry} type="button">Tentar novamente</Button>
  </main>;
}
