import { createClient, type Client } from "@libsql/client";
import type { SqlDb } from "../sql-db";

export class TursoDb implements SqlDb {
  private dbConn: Client;

  constructor(config: { url: string; authToken?: string }) {
    this.dbConn = createClient(config);
  }

  async execute(
    query: string,
    params?: unknown[]
  ): Promise<{ rows: Record<string, unknown>[] }> {
    const result = await this.dbConn.execute({ sql: query, args: params ?? [] });
    return { rows: result.rows as Record<string, unknown>[] };
  }

  async batch(queries: Array<{ query: string; params?: unknown[] }>): Promise<void> {
    await this.dbConn.batch(
      queries.map((q) => ({ sql: q.query, args: q.params ?? [] }))
    );
  }
}
