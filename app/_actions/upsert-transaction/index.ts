"use server";

import { db } from "@/app/_lib/prisma";
import { auth } from "@clerk/nextjs/server";
import {
  TransactionCategory,
  TransactionPaymentMethod,
  TransactionType,
} from "@prisma/client";
import { upsertTransactionSchema } from "./schema";
import { revalidatePath } from "next/cache";

interface UpsertTransactionParams {
  id?: string; // id is optional to allow creating new transactions
  name: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  paymentMethod: TransactionPaymentMethod;
  date: Date;
}

export const upsertTransaction = async (params: UpsertTransactionParams) => {
  // Validate input parameters using the schema
  upsertTransactionSchema.parse(params);

  // Get userId from the auth context
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Ensure that the 'id' is only passed when updating an existing transaction
  if (!params.id) {
    // Create new transaction when no 'id' is provided
    await db.transaction.create({
      data: { ...params, userId },
    });
  } else {
    await db.transaction.upsert({
      where: {
        id: params.id,
      },
      update: { ...params, userId },
      create: { ...params, userId },
    });
  }

  revalidatePath("/transactions");
};
