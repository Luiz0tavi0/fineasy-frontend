"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button, Field, Input, Select, SecondaryButton } from "@/components/ui";
import { formatBRL } from "@/lib/money";
import { purchaseSchema } from "./schemas";
import { useConfirmPurchase, useSimulatePurchase } from "./mutations";
import type { Account } from "@/features/accounts/types";
import type { Category } from "@/features/categories/types";
import type { CreditCard } from "@/features/credit-cards/types";
import type { PurchaseSimulationRequest, PurchasePreview } from "./types";
import type { z } from "zod";

type Values = z.infer<typeof purchaseSchema>;

export function PurchaseForm({ accounts, cards, categories, currentDate }: Readonly<{ accounts: Account[]; cards: CreditCard[]; categories: Category[]; currentDate: string }>) {
  const [submitted, setSubmitted] = useState<PurchaseSimulationRequest>();
  const [preview, setPreview] = useState<PurchasePreview>();
  const simulate = useSimulatePurchase();
  const confirm = useConfirmPurchase();
  const form = useForm<z.input<typeof purchaseSchema>, undefined, Values>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: { description: "", total_amount: "", purchase_date: currentDate, installment_total: 1, account_id: "", credit_card_id: "", category_id: "" },
  });
  const onSimulate = (values: Values) => {
    setSubmitted(values);
    simulate.mutate(values, { onSuccess: setPreview });
  };
  function onConfirm() {
    if (!submitted || !preview) return;
    confirm.mutate({
      ...submitted,
      installments: preview.installments.map(({ amount, due_date }) => ({ amount, due_date })),
    }, { onSuccess: () => { setPreview(undefined); setSubmitted(undefined); form.reset({ description: "", total_amount: "", purchase_date: currentDate, installment_total: 1, account_id: "", credit_card_id: "", category_id: "" }); } });
  }
  return <div className="space-y-6">
    <form className="max-w-2xl space-y-4 rounded-xl border bg-white p-5" onSubmit={form.handleSubmit(onSimulate)}>
      <fieldset className="space-y-4" disabled={Boolean(preview) || simulate.isPending}>
      <Field label="Descrição" error={form.formState.errors.description?.message}><Input {...form.register("description")} /></Field>
      <Field label="Valor total" error={form.formState.errors.total_amount?.message}><Input inputMode="decimal" type="text" {...form.register("total_amount")} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Data da compra" error={form.formState.errors.purchase_date?.message}><Input type="date" {...form.register("purchase_date")} /></Field>
        <Field label="Número de parcelas" error={form.formState.errors.installment_total?.message}><Input max="120" min="1" type="number" {...form.register("installment_total")} /></Field>
      </div>
      <Field label="Conta (opcional)"><Select {...form.register("account_id")}><option value="">Não vinculada</option>{accounts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>
      <Field label="Cartão de crédito (opcional)"><Select {...form.register("credit_card_id")}><option value="">Não vinculado</option>{cards.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>
      <Field label="Categoria (opcional)"><Select {...form.register("category_id")}><option value="">Sem categoria</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>
      <Button disabled={simulate.isPending || Boolean(preview)} type="submit">{simulate.isPending ? "Simulando…" : "Simular parcelas"}</Button>
      </fieldset>
    </form>
    {preview && <section className="rounded-xl border bg-white p-5">
      <h2 className="mb-4 text-lg font-semibold">Prévia das parcelas</h2>
      <div className="space-y-2">{preview.installments.map((item) => <div className="grid gap-2 border-b py-2 text-sm sm:grid-cols-[1fr_auto] sm:items-center" key={item.installment_number}>
        <span>Parcela {item.installment_number} · {formatBRL(item.amount)}</span>
        <Field label={`Data da parcela ${item.installment_number}`}>
          <Input
            aria-label={`Data da parcela ${item.installment_number}`}
            type="date"
            value={item.due_date}
            onChange={(event) => setPreview((current) => current ? {
              ...current,
              installments: current.installments.map((installment) => installment.installment_number === item.installment_number
                ? { ...installment, due_date: event.target.value }
                : installment),
            } : current)}
          />
        </Field>
      </div>)}</div>
      <div className="mt-4 flex flex-wrap gap-2"><Button disabled={confirm.isPending} onClick={onConfirm} type="button">{confirm.isPending ? "Confirmando…" : "Confirmar compra"}</Button><SecondaryButton disabled={confirm.isPending} onClick={() => { setPreview(undefined); setSubmitted(undefined); }} type="button">Editar dados</SecondaryButton></div>
    </section>}
  </div>;
}
