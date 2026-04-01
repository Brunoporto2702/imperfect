import { randomUUID } from "crypto";
import type { IntakeEntry, IntakeItem } from "../models/food";

export function buildIntakeItems(intakeEntry: IntakeEntry): IntakeItem[] {
  return intakeEntry.parsedItems.map((item) => ({
    id: randomUUID(),
    name: item.name,
    quantity: item.quantity,
    caloriesMin: item.caloriesMin,
    caloriesMax: item.caloriesMax,
    protein: item.protein,
    consumedAt: intakeEntry.createdAt,
    source: "ai" as const,
    processingId: intakeEntry.id,
    editedByUser: false,
    createdAt: intakeEntry.createdAt,
    updatedAt: intakeEntry.createdAt,
  }));
}
