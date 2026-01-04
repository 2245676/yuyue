import { getDb } from "./db.js";
import { items, type Item, type InsertItem } from "../drizzle/schema.js";
import { eq } from "drizzle-orm";

/**
 * 获取所有库存项目
 */
export async function getAllItems(): Promise<Item[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get items: database not available");
    return [];
  }
  
  return await db.select().from(items);
}

/**
 * 根据ID获取库存项目
 */
export async function getItemById(id: number): Promise<Item | undefined> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get item: database not available");
    return undefined;
  }
  
  const result = await db.select().from(items).where(eq(items.id, id));
  return result[0];
}

/**
 * 创建新库存项目
 */
export async function createItem(data: InsertItem): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  
  await db.insert(items).values(data);
}

/**
 * 更新库存项目
 */
export async function updateItem(id: number, data: Partial<InsertItem>): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  
  await db.update(items).set(data).where(eq(items.id, id));
}

/**
 * 更新库存剩余数量
 */
export async function updateItemStock(id: number, stockRemaining: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  
  await db.update(items).set({ stockRemaining }).where(eq(items.id, id));
}

/**
 * 删除库存项目
 */
export async function deleteItem(id: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  
  await db.delete(items).where(eq(items.id, id));
}
