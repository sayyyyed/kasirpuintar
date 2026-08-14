import { Database } from "@nozbe/watermelondb";
import SQLiteAdapter from "@nozbe/watermelondb/adapters/sqlite";
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
    PayrollPeriod,
  ],
});

export async function ensureTables() {
  try {
    await (adapter as any).unsafeExecuteSql(
      `CREATE TABLE IF NOT EXISTS payroll_periods (
         id varchar(16) primary key not null,
         user_id varchar(255) not null,
         period_start real,
         period_end real,
         total_hours real,
         hourly_rate real,
         gross_pay real,
         status varchar(255),
         paid_at real,
         note varchar(255),
         created_at real,
         updated_at real,
         deleted_at real,
         _status varchar(16) default 'created',
         _changed varchar(255) default ''
       );`
    );
  } catch {
    // table already exists or adapter not ready
  }
}
