"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Link from "next/link";
import { loginAction, registerAction } from "@/actions/auth";

const credentialsSchema = z.object({ email: z.string().min(3).max(320).email("Informe um e-mail válido"), password: z.string().min(8, "A senha deve ter ao menos 8 caracteres").max(128) });
type Credentials = z.infer<typeof credentialsSchema>;

export function AuthForm({ mode }: Readonly<{ mode: "login" | "register" }>) {
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<Credentials>({ resolver: zodResolver(credentialsSchema) });
  const isLogin = mode === "login";
  async function submit(values: Credentials) {
    const result = await (isLogin ? loginAction(values) : registerAction(values));
    if (result?.error) setError("root", { message: result.error });
  }
  return <main className="grid min-h-dvh place-items-center p-4"><form className="w-full max-w-sm space-y-4 rounded-xl bg-white p-6 shadow-sm" onSubmit={handleSubmit(submit)}>
    <div><h1 className="text-2xl font-semibold">FinEasy</h1><p className="text-sm text-slate-600">{isLogin ? "Entre na sua conta" : "Crie sua conta"}</p></div>
    <label className="block text-sm font-medium">E-mail<input className="mt-1 w-full rounded-md border p-2" type="email" autoComplete="email" {...register("email")} /></label>{errors.email && <p className="text-sm text-red-700">{errors.email.message}</p>}
    <label className="block text-sm font-medium">Senha<input className="mt-1 w-full rounded-md border p-2" type="password" autoComplete={isLogin ? "current-password" : "new-password"} {...register("password")} /></label>{errors.password && <p className="text-sm text-red-700">{errors.password.message}</p>}
    {errors.root && <p role="alert" className="text-sm text-red-700">{errors.root.message}</p>}
    <button className="w-full rounded-md bg-slate-900 px-4 py-2 font-medium text-white disabled:opacity-60" disabled={isSubmitting}>{isSubmitting ? "Aguarde…" : isLogin ? "Entrar" : "Criar conta"}</button>
    <p className="text-sm text-slate-600">{isLogin ? "Ainda não tem conta?" : "Já tem uma conta?"} <Link className="underline" href={isLogin ? "/register" : "/login"}>{isLogin ? "Cadastre-se" : "Entrar"}</Link></p>
  </form></main>;
}
