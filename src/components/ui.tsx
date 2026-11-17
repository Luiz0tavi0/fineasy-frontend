"use client";

import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { Button as ShadcnButton } from "@/components/ui/button";
import { Input as ShadcnInput } from "@/components/ui/input";
import { Badge as ShadcnBadge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog as ShadcnDialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const buttonClass =
  "inline-flex min-h-10 items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50";
export const secondaryButtonClass =
  "inline-flex min-h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50";
export const inputClass =
  "mt-1 min-h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-600 focus:ring-2 focus:ring-slate-200";

export function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className = "", ...rest } = props;
  return <ShadcnButton className={`${buttonClass} ${className}`} size="lg" {...rest} />;
}

export function SecondaryButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className = "", ...rest } = props;
  return <ShadcnButton className={`${secondaryButtonClass} ${className}`} size="lg" variant="outline" {...rest} />;
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return <ShadcnInput className={`${inputClass} ${className}`} {...rest} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = "", ...rest } = props;
  return <select className={`${inputClass} ${className}`} {...rest} />;
}

export function Badge({ children, className, variant = "secondary" }: Readonly<{ children: ReactNode; className?: string; variant?: "default" | "secondary" | "destructive" | "outline" }>) {
  return <ShadcnBadge className={className} variant={variant}>{children}</ShadcnBadge>;
}

export function Field({
  label,
  error,
  children,
}: Readonly<{ label: string; error?: string; children: ReactNode }>) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-800">
        {label}
        {children}
      </label>
      {error && <p className="mt-1 text-sm text-red-700">{error}</p>}
    </div>
  );
}

export function Panel({
  title,
  children,
  action,
}: Readonly<{ title: string; children: ReactNode; action?: ReactNode }>) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function EmptyState({
  message,
  action,
}: Readonly<{ message: string; action?: ReactNode }>) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 px-4 py-10 text-center">
      <p className="text-sm text-slate-600">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LoadingRows({ count = 4 }: Readonly<{ count?: number }>) {
  return (
    <div aria-label="Carregando" className="space-y-3">
      {Array.from({ length: count }, (_, index) => (
        <div className="h-12 animate-pulse rounded bg-slate-200" key={index} />
      ))}
    </div>
  );
}

export function ErrorMessage({ message }: Readonly<{ message: string }>) {
  return <p className="rounded-md bg-red-50 p-3 text-sm text-red-800" role="alert">{message}</p>;
}

export function Dialog({
  title,
  open,
  onClose,
  children,
}: Readonly<{ title: string; open: boolean; onClose: () => void; children: ReactNode }>) {
  return (
    <ShadcnDialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <DialogContent className="fixed inset-x-0 top-auto bottom-0 left-0 max-h-[90dvh] w-full translate-x-0 translate-y-0 overflow-y-auto rounded-t-xl p-5 sm:inset-x-auto sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        {children}
      </DialogContent>
    </ShadcnDialog>
  );
}

export function ConfirmDialog({
  title = "Tem certeza?",
  description = "Esta ação não pode ser desfeita.",
  confirmLabel = "Confirmar",
  open,
  pending,
  onClose,
  onConfirm,
}: Readonly<{
  title?: string;
  description?: string;
  confirmLabel?: string;
  open: boolean;
  pending?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}>) {
  return <AlertDialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel disabled={pending}>Voltar</AlertDialogCancel>
        <AlertDialogAction disabled={pending} onClick={(event) => { event.preventDefault(); onConfirm(); }}>{pending ? "Aguarde…" : confirmLabel}</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>;
}

export function PageTitle({
  title,
  description,
  action,
}: Readonly<{ title: string; description?: string; action?: ReactNode }>) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
      </div>
      {action}
    </div>
  );
}
