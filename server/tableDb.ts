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

  console.log("[Database] Creating table with params:", JSON.stringify(table, null, 2));

  // 确保 capacity 是数字类型
  const capacity = typeof table.capacity === 'string' ? parseInt(table.capacity) : table.capacity;
  
  // 构建插入数据，只包含非 undefined 的字段
  const insertData: any = {
    tableNumber: table.tableNumber,
    capacity: capacity,
  };
  
  // 添加可选字段
  if (table.area !== undefined && table.area !== null && table.area !== '') {
    insertData.area = table.area;
  }
  if (table.type !== undefined && table.type !== null && table.type !== '') {
    insertData.type = table.type;
  }
  if (table.notes !== undefined && table.notes !== null && table.notes !== '') {
    insertData.notes = table.notes;
  }

  console.log("[Database] Insert data:", JSON.stringify(insertData, null, 2));

  try {
    const result = await db.insert(tables).values(insertData);
    console.log("[Database] Table created successfully");
    return result;
  } catch (error) {
    console.error("[Database] Insert error:", error);
    throw error;
  }
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
