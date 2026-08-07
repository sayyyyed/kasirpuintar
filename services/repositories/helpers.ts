import { database } from "@/db";

export async function enqueueMutation(
  tableName: string,
  recordId: string,
  operation: string,
  payload: Record<string, unknown>
) {
  await database.write(async () => {
    const collection = database.get("sync_outbox");
    await collection.create((raw: any) => {
      raw._raw.id = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
      raw.tableName = tableName;
      raw.recordId = recordId;
      raw.operation = operation;
      raw.payload = JSON.stringify(payload);
      raw.attempts = 0;
      raw.created_at = Date.now();
    });
  });
}
