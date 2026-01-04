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
  /** 桌号，存储数字，例如：1, 2, 3 */
  tableNumber: int("tableNumber").notNull().unique(),
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

/**
 * 预约管理表
 * 用于存储餐厅的预约信息
 */
export const reservations = mysqlTable("reservations", {
  id: int("id").autoincrement().primaryKey(),
  /** 关联的桌位ID */
  tableId: int("tableId").notNull(),
  /** 客户姓名 */
  customerName: varchar("customerName", { length: 100 }).notNull(),
  /** 客户电话 */
  customerPhone: varchar("customerPhone", { length: 50 }).notNull(),
  /** 客户邮箱 */
  customerEmail: varchar("customerEmail", { length: 100 }),
  /** 预约人数 */
  partySize: int("partySize").notNull(),
  /** 预约日期时间 */
  reservationTime: timestamp("reservationTime").notNull(),
  /** 预约时长（分钟） */
  duration: int("duration").default(120).notNull(),
  /** 预约状态: pending(待确认), confirmed(已确认), cancelled(已取消), completed(已完成), no_show(未到店) */
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  /** 特殊要求/备注 */
  notes: text("notes"),
  /** 创建人ID */
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Reservation = typeof reservations.$inferSelect;
export type InsertReservation = typeof reservations.$inferInsert;

/**
 * 系统配置表
 * 用于存储系统级别的配置参数
 */
export const systemConfig = mysqlTable("system_config", {
  id: int("id").autoincrement().primaryKey(),
  /** 配置键 */
  configKey: varchar("configKey", { length: 100 }).notNull().unique(),
  /** 配置值 */
  configValue: text("configValue").notNull(),
  /** 配置描述 */
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SystemConfig = typeof systemConfig.$inferSelect;
export type InsertSystemConfig = typeof systemConfig.$inferInsert;

/**
 * 库存管理表
 * 用于快速录入和管理菜品/食材的剩余库存
 */
export const items = mysqlTable("items", {
  id: int("id").autoincrement().primaryKey(),
  /** 菜品/食材名称 */
  name: varchar("name", { length: 100 }).notNull(),
  /** 分类，例如：主菜、小菜、饮料、食材 */
  category: varchar("category", { length: 50 }).notNull(),
  /** 渠道/超市，例如：永辉、盒马、山姆 */
  vendor: varchar("vendor", { length: 100 }),
  /** 单位，例如：份、kg、瓶 */
  unit: varchar("unit", { length: 20 }).notNull().default("份"),
  /** 剩余库存数量 */
  stockRemaining: int("stockRemaining").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Item = typeof items.$inferSelect;
export type InsertItem = typeof items.$inferInsert;
