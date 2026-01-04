import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as tableDb from "./tableDb";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("table management", () => {
  it("should list all tables", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.table.list();

    expect(Array.isArray(result)).toBe(true);
  });

  it("should create a new table", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const tableNumber = Math.floor(Math.random() * 10000) + 3000;
    
    const result = await caller.table.create({
      tableNumber,
      capacity: 4,
      area: "测试区域",
      type: "普通桌",
      notes: "这是一个测试桌位",
    });

    expect(result.success).toBe(true);

    // 验证桌位是否创建成功
    const tables = await caller.table.list();
    const createdTable = tables.find(t => t.tableNumber === tableNumber);
    expect(createdTable).toBeDefined();
    expect(createdTable?.capacity).toBe(4);
    expect(createdTable?.area).toBe("测试区域");
  });

  it("should update a table", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // 先创建一个桌位
    const tableNumber = Math.floor(Math.random() * 10000) + 4000;
    await caller.table.create({
      tableNumber,
      capacity: 4,
      area: "原始区域",
      type: "普通桌",
    });

    // 获取创建的桌位
    const tables = await caller.table.list();
    const table = tables.find(t => t.tableNumber === tableNumber);
    expect(table).toBeDefined();

    // 更新桌位
    const updateResult = await caller.table.update({
      id: table!.id,
      capacity: 6,
      area: "更新后的区域",
    });

    expect(updateResult.success).toBe(true);

    // 验证更新是否成功
    const updatedTable = await caller.table.getById({ id: table!.id });
    expect(updatedTable?.capacity).toBe(6);
    expect(updatedTable?.area).toBe("更新后的区域");
  });

  it("should delete a table (soft delete)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // 先创建一个桌位
    const tableNumber = Math.floor(Math.random() * 10000) + 5000;
    await caller.table.create({
      tableNumber,
      capacity: 4,
      area: "待删除区域",
      type: "普通桌",
    });

    // 获取创建的桌位
    const tables = await caller.table.list();
    const table = tables.find(t => t.tableNumber === tableNumber);
    expect(table).toBeDefined();

    // 删除桌位
    const deleteResult = await caller.table.delete({ id: table!.id });
    expect(deleteResult.success).toBe(true);

    // 验证软删除是否成功（isActive应该为0）
    const deletedTable = await caller.table.getById({ id: table!.id });
    expect(deletedTable?.isActive).toBe(0);

    // 验证在活跃桌位列表中不存在
    const activeTables = await caller.table.listActive();
    const foundInActive = activeTables.find(t => t.id === table!.id);
    expect(foundInActive).toBeUndefined();
  });

  it("should list only active tables", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // 创建一个活跃桌位
    const activeTableNumber = Math.floor(Math.random() * 10000) + 1000;
    await caller.table.create({
      tableNumber: activeTableNumber,
      capacity: 4,
    });

    // 创建一个桌位并删除它
    const inactiveTableNumber = Math.floor(Math.random() * 10000) + 2000;
    await caller.table.create({
      tableNumber: inactiveTableNumber,
      capacity: 4,
    });
    
    const tables = await caller.table.list();
    const inactiveTable = tables.find(t => t.tableNumber === inactiveTableNumber);
    if (inactiveTable) {
      await caller.table.delete({ id: inactiveTable.id });
    }

    // 获取活跃桌位列表
    const activeTables = await caller.table.listActive();
    
    // 验证活跃桌位存在
    const foundActive = activeTables.find(t => t.tableNumber === activeTableNumber);
    expect(foundActive).toBeDefined();

    // 验证非活跃桌位不存在
    const foundInactive = activeTables.find(t => t.tableNumber === inactiveTableNumber);
    expect(foundInactive).toBeUndefined();
  });
});
