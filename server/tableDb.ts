import { eq } from "drizzle-orm";
import { tables, InsertTable } from "../drizzle/schema";
import { getDb } from "./db";

/**
 * 获取所有桌位列表
 */
export async function getAllTables() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get tables: database not available");
    return [];
  }

  const result = await db.select().from(tables);
  return result;
}

/**
 * 根据ID获取单个桌位
 */
export async function getTableById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get table: database not available");
    return undefined;
  }

  const result = await db.select().from(tables).where(eq(tables.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * 创建新桌位
 */
export async function createTable(table: InsertTable) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create table: database not available");
    throw new Error("Database not available");
  }

  // 记录详细的输入参数
  console.log("[Database] Creating table with params:", JSON.stringify(table, null, 2));
  console.log("[Database] Param types:", {
    tableNumber: typeof table.tableNumber,
    capacity: typeof table.capacity,
    area: typeof table.area,
    type: typeof table.type,
  });

  // 确保 capacity 是数字类型
  const validatedTable = {
    ...table,
    capacity: typeof table.capacity === 'string' ? parseInt(table.capacity) : table.capacity,
  };

  console.log("[Database] Validated table:", JSON.stringify(validatedTable, null, 2));

  const result = await db.insert(tables).values(validatedTable);
  return result;
}

/**
 * 更新桌位信息
 */
export async function updateTable(id: number, data: Partial<InsertTable>) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update table: database not available");
    throw new Error("Database not available");
  }

  const result = await db.update(tables).set(data).where(eq(tables.id, id));
  return result;
}

/**
 * 删除桌位（软删除，设置isActive为0）
 */
export async function deleteTable(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete table: database not available");
    throw new Error("Database not available");
  }

  const result = await db.update(tables).set({ isActive: 0 }).where(eq(tables.id, id));
  return result;
}

/**
 * 获取所有可用桌位（isActive = 1）
 */
export async function getActiveTables() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get active tables: database not available");
    return [];
  }

  const result = await db.select().from(tables).where(eq(tables.isActive, 1));
  return result;
}
