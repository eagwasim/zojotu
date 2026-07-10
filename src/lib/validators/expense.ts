import { z } from "zod";

export const expenseSchema = z.object({
  date: z.string().min(1, "Date is required"),
  category: z.enum([
    "Tools",
    "Supplies",
    "Software",
    "Shipping",
    "Marketing",
    "Other",
  ]),
  description: z.string().min(1, "Description is required"),
  amount: z.number().positive("Amount must be positive"),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;
