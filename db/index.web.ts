import { Database } from "@nozbe/watermelondb";
import LokiJSAdapter from "@nozbe/watermelondb/adapters/lokijs";
import { schema } from "./schema";
import { migrations } from "./migrations";
import {
  Category,
  Expense,
  PayrollPeriod,
  Product,
  Shift,
  StockMovement,
  SyncOutbox,
  Transaction,
  TransactionItem,
  User,
} from "./models";

const adapter = new LokiJSAdapter({
  schema,
  migrations,
  dbName: "kasirpuintar-web",
  useWebWorker: false,
  useIncrementalIndexedDB: true,
});

export const database = new Database({
  adapter,
  modelClasses: [
    User,
    Category,
    Product,
    Shift,
    Transaction,
    TransactionItem,
    StockMovement,
    Expense,
    SyncOutbox,
    PayrollPeriod,
  ],
});

export async function ensureTables() {
  // LokiJS creates the collections from the WatermelonDB schema.
}
