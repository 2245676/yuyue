import { describe, it, expect, beforeAll } from "vitest";
import * as reservationDb from "./reservationDb";
import * as tableDb from "./tableDb";
import { getDb } from "./db";

describe("Reservation Management", () => {
  let testTableId: number;
  let testReservationId: number;

  beforeAll(async () => {
    // 创建测试桌位（使用随机数字确保唯一性）
    const uniqueTableNumber = Math.floor(Math.random() * 10000) + 7000;
    await tableDb.createTable({
      tableNumber: uniqueTableNumber,
      capacity: 4,
      area: "测试区",
      isActive: true,
    });

    const tables = await tableDb.getAllTables();
    const testTable = tables.find((t) => t.tableNumber === uniqueTableNumber);
    if (testTable) {
      testTableId = testTable.id;
    }
  });

  it("should create a new reservation", async () => {
    const reservationTime = new Date("2026-01-10T18:00:00");
    
    await reservationDb.createReservation({
      tableId: testTableId,
      customerName: "测试客户",
      customerPhone: "13800138000",
      customerEmail: "test@example.com",
      partySize: 4,
      reservationTime,
      duration: 120,
      status: "confirmed",
      notes: "测试预约",
    });

    const reservations = await reservationDb.getAllReservations();
    const testReservation = reservations.find(
      (r) => r.customerName === "测试客户"
    );

    expect(testReservation).toBeDefined();
    expect(testReservation?.tableId).toBe(testTableId);
    expect(testReservation?.partySize).toBe(4);
    expect(testReservation?.status).toBe("confirmed");

    if (testReservation) {
      testReservationId = testReservation.id;
    }
  });

  it("should get reservation by ID", async () => {
    const reservation = await reservationDb.getReservationById(testReservationId);
    
    expect(reservation).toBeDefined();
    expect(reservation?.customerName).toBe("测试客户");
    expect(reservation?.customerPhone).toBe("13800138000");
  });

  it("should get reservations by date range", async () => {
    const startDate = new Date("2026-01-10T00:00:00");
    const endDate = new Date("2026-01-10T23:59:59");
    
    const reservations = await reservationDb.getReservationsByDateRange(
      startDate,
      endDate
    );

    expect(reservations.length).toBeGreaterThan(0);
    const testReservation = reservations.find(
      (r) => r.id === testReservationId
    );
    expect(testReservation).toBeDefined();
  });

  it("should get reservations by table ID", async () => {
    const reservations = await reservationDb.getReservationsByTableId(testTableId);
    
    expect(reservations.length).toBeGreaterThan(0);
    expect(reservations[0].tableId).toBe(testTableId);
  });

  it("should get reservations by status", async () => {
    const reservations = await reservationDb.getReservationsByStatus("confirmed");
    
    expect(reservations.length).toBeGreaterThan(0);
    const testReservation = reservations.find(
      (r) => r.id === testReservationId
    );
    expect(testReservation).toBeDefined();
  });

  it("should update reservation", async () => {
    await reservationDb.updateReservation(testReservationId, {
      partySize: 6,
      notes: "更新后的备注",
    });

    const updated = await reservationDb.getReservationById(testReservationId);
    expect(updated?.partySize).toBe(6);
    expect(updated?.notes).toBe("更新后的备注");
  });

  it("should check reservation conflict", async () => {
    const reservationTime = new Date("2026-01-10T18:00:00");
    
    // 应该检测到冲突（与现有预约时间重叠）
    const hasConflict = await reservationDb.checkReservationConflict(
      testTableId,
      reservationTime,
      120
    );

    expect(hasConflict).toBe(true);

    // 不应该检测到冲突（不同时间）
    const noConflict = await reservationDb.checkReservationConflict(
      testTableId,
      new Date("2026-01-10T21:00:00"),
      120
    );

    expect(noConflict).toBe(false);
  });

  it("should delete reservation", async () => {
    await reservationDb.deleteReservation(testReservationId);

    const deleted = await reservationDb.getReservationById(testReservationId);
    expect(deleted).toBeUndefined();
  });

  it("should clean up test data", async () => {
    // 清理测试桌位（软删除）
    await tableDb.deleteTable(testTableId);
    
    const table = await tableDb.getTableById(testTableId);
    // 软删除后桌位仍然存在，但 isActive 应为 0 或 false
    expect(table).toBeDefined();
    expect(table?.isActive).toBeFalsy(); // 数据库返回 0，使用 toBeFalsy() 更合适
  });
});
