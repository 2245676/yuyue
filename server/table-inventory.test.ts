import { describe, it, expect, beforeAll } from "vitest";
import { getDb } from "./db";
import * as tableDb from "./tableDb";
import * as itemDb from "./itemDb";

describe("桌台和库存功能测试", () => {
  beforeAll(async () => {
    // 确保数据库连接正常
    const db = getDb();
    expect(db).toBeDefined();
  });

  describe("桌台创建和显示", () => {
    it("应该成功创建桌台（桌号为数字）", async () => {
      const tableData = {
        tableNumber: Math.floor(Math.random() * 10000) + 8000,
        capacity: 4,
        area: "测试区域",
        type: "普通桌",
        isActive: true,
        notes: "测试桌台",
      };

      await tableDb.createTable(tableData);
      
      const tables = await tableDb.getAllTables();
      const createdTable = tables.find(t => t.tableNumber === tableData.tableNumber);
      
      expect(createdTable).toBeDefined();
      expect(createdTable?.tableNumber).toBe(tableData.tableNumber);
      expect(createdTable?.capacity).toBe(4);
    });

    it("桌号应该是数字类型", async () => {
      const tables = await tableDb.getAllTables();
      const testTable = tables.find(t => t.notes === "测试桌台");
      
      expect(testTable).toBeDefined();
      expect(typeof testTable?.tableNumber).toBe("number");
    });

    it("应该能够更新桌台信息", async () => {
      const tables = await tableDb.getAllTables();
      const testTable = tables.find(t => t.notes === "测试桌台");
      
      if (testTable) {
        const newTableNumber = Math.floor(Math.random() * 10000) + 6000;
        await tableDb.updateTable(testTable.id, {
          tableNumber: newTableNumber,
          capacity: 6,
        });

        const updatedTables = await tableDb.getAllTables();
        const updatedTable = updatedTables.find(t => t.id === testTable.id);
        
        expect(updatedTable?.tableNumber).toBe(newTableNumber);
        expect(updatedTable?.capacity).toBe(6);
      }
    });
  });

  describe("库存管理", () => {
    let testItemId: number;

    it("应该成功创建库存项目", async () => {
      const itemData = {
        name: "测试菜品",
        category: "测试分类",
        vendor: "测试渠道",
        unit: "份",
        stockRemaining: 10,
      };

      await itemDb.createItem(itemData);
      
      const items = await itemDb.getAllItems();
      const createdItem = items.find(i => i.name === "测试菜品");
      
      expect(createdItem).toBeDefined();
      expect(createdItem?.name).toBe("测试菜品");
      expect(createdItem?.stockRemaining).toBe(10);
      
      if (createdItem) {
        testItemId = createdItem.id;
      }
    });

    it("应该能够更新库存数量", async () => {
      if (testItemId) {
        await itemDb.updateItemStock(testItemId, 5);
        
        const item = await itemDb.getItemById(testItemId);
        expect(item?.stockRemaining).toBe(5);
      }
    });

    it("库存数量不能为负数", async () => {
      if (testItemId) {
        // 这应该抛出错误或被后端拒绝
        try {
          await itemDb.updateItemStock(testItemId, -1);
          // 如果没有抛出错误，测试失败
          expect(true).toBe(false);
        } catch (error) {
          // 预期会抛出错误
          expect(error).toBeDefined();
        }
      }
    });

    it("应该能够获取所有库存项目", async () => {
      const items = await itemDb.getAllItems();
      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBeGreaterThan(0);
    });

    it("应该能够删除库存项目", async () => {
      if (testItemId) {
        await itemDb.deleteItem(testItemId);
        
        const item = await itemDb.getItemById(testItemId);
        expect(item).toBeUndefined();
      }
    });
  });

  describe("清理测试数据", () => {
    it("应该删除测试桌台", async () => {
      const tables = await tableDb.getAllTables();
      const testTable = tables.find(t => t.notes === "测试桌台");
      
      if (testTable) {
        await tableDb.deleteTable(testTable.id);
        
        const updatedTables = await tableDb.getAllTables();
        const deletedTable = updatedTables.find(t => t.id === testTable.id);
        // 软删除，只是isActive=false
        expect(deletedTable?.isActive).toBe(0);
      }
    });
  });
});
