import { schemaMigrations, addColumns, unsafeExecuteSql } from "@nozbe/watermelondb/Schema/migrations";

export const migrations = schemaMigrations({
  migrations: [
    {
      toVersion: 2,
      steps: [
        addColumns({
          table: "expenses",
          columns: [{ name: "type", type: "string" }],
        }),
      ],
    },
    {
      toVersion: 3,
      steps: [
        addColumns({
          table: "users",
          columns: [{ name: "hourly_rate", type: "number", isOptional: true }],
        }),
      ],
    },
    {
      toVersion: 4,
      steps: [
        unsafeExecuteSql(
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
        ),
      ],
    },
    {
      toVersion: 5,
      steps: [
        unsafeExecuteSql(
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
        ),
      ],
    },
    {
      toVersion: 6,
      steps: [
        unsafeExecuteSql(
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
        ),
      ],
    },
    {
      toVersion: 7,
      steps: [
        addColumns({
          table: "users",
          columns: [{ name: "pin", type: "string", isOptional: true }],
        }),
      ],
    },
  ],
});
