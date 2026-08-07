import { Database } from "@nozbe/watermelondb";
import SQLiteAdapter from "@nozbe/watermelondb/adapters/sqlite";
import { schema } from "./schema";
import { migrations } from "./migrations";
import {
  Category,
  Expense,
  Product,
  Shift,
  StockMovement,
  SyncOutbox,
  Transaction,
  TransactionItem,
  User,
} from "./models";

const adapter = new SQLiteAdapter({
  schema,
  migrations,
  dbName: "kasirpuintar",
  jsi: true,
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
  ],
});
