import { eq, and, gte, lte, between } from "drizzle-orm";
import { reservations, InsertReservation } from "../drizzle/schema";
import { getDb } from "./db";

/**
 * 获取所有预约列表
 */
export async function getAllReservations() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get reservations: database not available");
    return [];
  }

  const result = await db.select().from(reservations);
  return result;
}

/**
 * 根据ID获取单个预约
 */
export async function getReservationById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get reservation: database not available");
    return undefined;
  }

  const result = await db.select().from(reservations).where(eq(reservations.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * 根据日期范围获取预约列表
 */
export async function getReservationsByDateRange(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get reservations: database not available");
    return [];
  }

  const result = await db
    .select()
    .from(reservations)
    .where(
      and(
        gte(reservations.reservationTime, startDate),
        lte(reservations.reservationTime, endDate)
      )
    );
  return result;
}

/**
 * 根据桌位ID获取预约列表
 */
export async function getReservationsByTableId(tableId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get reservations: database not available");
    return [];
  }

  const result = await db
    .select()
    .from(reservations)
    .where(eq(reservations.tableId, tableId));
  return result;
}

/**
 * 根据状态获取预约列表
 */
export async function getReservationsByStatus(status: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get reservations: database not available");
    return [];
  }

  const result = await db
    .select()
    .from(reservations)
    .where(eq(reservations.status, status));
  return result;
}

/**
 * 创建新预约
 */
export async function createReservation(reservation: InsertReservation) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create reservation: database not available");
    throw new Error("Database not available");
  }

  const result = await db.insert(reservations).values(reservation);
  return result;
}

/**
 * 更新预约信息
 */
export async function updateReservation(id: number, data: Partial<InsertReservation>) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update reservation: database not available");
    throw new Error("Database not available");
  }

  const result = await db.update(reservations).set(data).where(eq(reservations.id, id));
  return result;
}

/**
 * 删除预约
 */
export async function deleteReservation(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete reservation: database not available");
    throw new Error("Database not available");
  }

  const result = await db.delete(reservations).where(eq(reservations.id, id));
  return result;
}

/**
 * 检查时间段内是否有冲突的预约
 */
export async function checkReservationConflict(
  tableId: number,
  reservationTime: Date,
  duration: number,
  excludeId?: number
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot check conflict: database not available");
    return false;
  }

  const endTime = new Date(reservationTime.getTime() + duration * 60000);

  const conditions = [
    eq(reservations.tableId, tableId),
    // 检查时间是否重叠
    gte(reservations.reservationTime, reservationTime),
    lte(reservations.reservationTime, endTime)
  ];

  // 如果是更新操作，排除当前预约
  if (excludeId) {
    conditions.push(eq(reservations.id, excludeId));
  }

  const conflicts = await db
    .select()
    .from(reservations)
    .where(and(...conditions));

  return conflicts.length > 0;
}
