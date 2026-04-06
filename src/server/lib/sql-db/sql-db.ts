export type SqlParam = string | number | bigint | boolean | null | ArrayBuffer | Uint8Array;

export interface SqlDb {
  execute(query: string, params?: SqlParam[]): Promise<{ rows: Record<string, unknown>[] }>
  batch(queries: Array<{ query: string; params?: SqlParam[] }>): Promise<void>
}
