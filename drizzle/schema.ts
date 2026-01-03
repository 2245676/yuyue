import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * 桌位管理表
 * 用于存储餐厅的桌位信息
 */
export const tables = mysqlTable("tables", {
  id: int("id").autoincrement().primaryKey(),
  /** 桌号，例如：A1, B2, VIP1 */
  tableNumber: varchar("tableNumber", { length: 50 }).notNull().unique(),
  /** 桌位容量（可容纳人数） */
  capacity: int("capacity").notNull(),
  /** 桌位区域，例如：大厅、包间、靠窗 */
  area: varchar("area", { length: 100 }),
  /** 桌位类型，例如：普通桌、VIP桌、包间 */
  type: varchar("type", { length: 50 }),
  /** 是否可用 */
  isActive: int("isActive").default(1).notNull(),
  /** 备注 */
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Table = typeof tables.$inferSelect;
export type InsertTable = typeof tables.$inferInsert;