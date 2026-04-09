import type { SqlDb } from "@/server/lib/sql-db/sql-db";
import type { User } from "../models/user";
import * as UserRepository from "../../providers/persistence/sql/user";

export type FindOrCreateUserResult = {
  user: User;
  isNew: boolean;
};

export async function findOrCreateUser(db: SqlDb, email: string): Promise<FindOrCreateUserResult> {
  const existing = await UserRepository.findUserByEmail(db, email);
  if (existing) {
    return { user: existing, isNew: false };
  }
  const user = await UserRepository.createUser(db, email);
  return { user, isNew: true };
}
