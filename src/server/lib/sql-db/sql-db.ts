export interface SqlDb {
  execute(query: string, params?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>
  batch(queries: Array<{ query: string; params?: unknown[] }>): Promise<void>
}
