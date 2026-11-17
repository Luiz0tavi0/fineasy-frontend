import type { components } from "@/api/schema";

export type Transaction = components["schemas"]["TransactionResponse"];
export type TransactionCreate = components["schemas"]["TransactionCreate"];
export type TransactionPatch = components["schemas"]["TransactionPatch"];
export type TransactionStatus = components["schemas"]["TransactionStatus"];
export type TransactionDirection = components["schemas"]["TransactionDirection"];
export type TransactionComplete = components["schemas"]["TransactionComplete"];
export type TransactionAmountUpdate = components["schemas"]["TransactionAmountUpdate"];
