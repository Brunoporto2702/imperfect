import { TursoDb } from "./turso-db";
import type { SqlDb } from "../sql-db";

export function createInMemoryDb(): SqlDb {
  return new TursoDb({ url: ":memory:" });
}
