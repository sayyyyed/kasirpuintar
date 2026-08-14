import { Model } from "@nozbe/watermelondb";
import {
  date,
  field,
  readonly,
} from "@nozbe/watermelondb/decorators";

export type Role = "owner" | "cashier";
export type ShiftStatus = "open" | "closed";
export type PaymentMethod = "cash" | "qris" | "transfer";
export type MovementType = "sale" | "restock" | "adjustment";
export type ExpenseType = "income" | "expense";
export type SyncOperation = "create" | "update" | "delete";
export type PayrollStatus = "pending" | "paid";

export class User extends Model {
  static table = "users";

  @field("name") name!: string;
  @field("email") email!: string;
  @field("role") role!: Role;
  @field("pin_hash") pinHash?: string;
  @field("hourly_rate") hourlyRate?: number;
  @field("active") active!: boolean;
  @readonly @date("created_at") createdAt!: Date;
  @date("updated_at") updatedAt!: Date;
  @date("deleted_at") deletedAt?: Date;
}

export class Category extends Model {
  static table = "categories";

  @field("name") name!: string;
  @field("sort_order") sortOrder!: number;
  @readonly @date("created_at") createdAt!: Date;
  @date("updated_at") updatedAt!: Date;
  @date("deleted_at") deletedAt?: Date;
}

export class Product extends Model {
  static table = "products";

  @field("sku") sku!: string;
  @field("barcode") barcode?: string;
  @field("name") name!: string;
  @field("category_id") categoryId!: string;
  @field("price") price!: number;
  @field("cogs") cogs!: number;
  @field("stock") stock!: number;
  @field("image_url") imageUrl?: string;
  @field("active") active!: boolean;
  @readonly @date("created_at") createdAt!: Date;
  @date("updated_at") updatedAt!: Date;
  @date("deleted_at") deletedAt?: Date;
}

export class Shift extends Model {
  static table = "shifts";

  @field("user_id") userId!: string;
  @date("clock_in_at") clockInAt!: Date;
  @date("clock_out_at") clockOutAt?: Date;
  @field("opening_cash") openingCash!: number;
  @field("closing_cash") closingCash?: number;
  @field("sales_total") salesTotal!: number;
  @field("expense_total") expenseTotal!: number;
  @field("status") status!: ShiftStatus;
  @readonly @date("created_at") createdAt!: Date;
  @date("updated_at") updatedAt!: Date;
  @date("deleted_at") deletedAt?: Date;
}

export class Transaction extends Model {
  static table = "transactions";

  @field("shift_id") shiftId!: string;
  @field("user_id") userId!: string;
  @field("subtotal") subtotal!: number;
  @field("discount") discount!: number;
  @field("total") total!: number;
  @field("payment_method") paymentMethod!: PaymentMethod;
  @field("paid") paid!: number;
  @field("change") change!: number;
  @readonly @date("created_at") createdAt!: Date;
  @date("updated_at") updatedAt!: Date;
  @date("deleted_at") deletedAt?: Date;
}

export class TransactionItem extends Model {
  static table = "transaction_items";

  @field("transaction_id") transactionId!: string;
  @field("product_id") productId!: string;
  @field("product_name") productName!: string;
  @field("price") price!: number;
  @field("cogs") cogs!: number;
  @field("qty") qty!: number;
  @field("subtotal") subtotal!: number;
  @readonly @date("created_at") createdAt!: Date;
  @date("updated_at") updatedAt!: Date;
  @date("deleted_at") deletedAt?: Date;
}

export class StockMovement extends Model {
  static table = "stock_movements";

  @field("product_id") productId!: string;
  @field("type") type!: MovementType;
  @field("qty") qty!: number;
  @field("ref_type") refType?: string;
  @field("ref_id") refId?: string;
  @field("note") note?: string;
  @readonly @date("created_at") createdAt!: Date;
  @date("updated_at") updatedAt!: Date;
  @date("deleted_at") deletedAt?: Date;
}

export class Expense extends Model {
  static table = "expenses";

  @field("shift_id") shiftId!: string;
  @field("user_id") userId!: string;
  @field("name") name!: string;
  @field("category") category!: string;
  @field("type") type!: ExpenseType;
  @field("amount") amount!: number;
  @field("note") note?: string;
  @readonly @date("created_at") createdAt!: Date;
  @date("updated_at") updatedAt!: Date;
  @date("deleted_at") deletedAt?: Date;
}

export class SyncOutbox extends Model {
  static table = "sync_outbox";

  @field("table_name") tableName!: string;
  @field("record_id") recordId!: string;
  @field("operation") operation!: SyncOperation;
  @field("payload") payload!: string;
  @field("attempts") attempts!: number;
  @readonly @date("created_at") createdAt!: Date;
}

export class PayrollPeriod extends Model {
  static table = "payroll_periods";

  @field("user_id") userId!: string;
  @date("period_start") periodStart!: Date;
  @date("period_end") periodEnd!: Date;
  @field("total_hours") totalHours!: number;
  @field("hourly_rate") hourlyRate!: number;
  @field("gross_pay") grossPay!: number;
  @field("status") status!: PayrollStatus;
  @date("paid_at") paidAt?: Date;
  @field("note") note?: string;
  @readonly @date("created_at") createdAt!: Date;
  @date("updated_at") updatedAt!: Date;
  @date("deleted_at") deletedAt?: Date;
}
