import { describe, it, expect, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { Context } from "./_core/context";
import { getDb } from "./db";
import { systemConfig } from "../drizzle/schema";

// Mock context with authenticated user
const createMockContext = (): Context => ({
  user: {
    id: 1,
    openId: "test-open-id",
    name: "Test User",
    email: "test@example.com",
    role: "admin",
    createdAt: new Date(),
  },
  req: {} as any,
  res: {} as any,
});

describe("系统配置管理", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(async () => {
    // 清空配置表
    const db = await getDb();
    if (db) {
      await db.delete(systemConfig);
    }
    
    // 创建测试caller
    caller = appRouter.createCaller(createMockContext());
  });

  it("应该能够创建新配置", async () => {
    const result = await caller.config.upsert({
      key: "test_config",
      value: "test_value",
      description: "测试配置",
    });

    expect(result.success).toBe(true);

    const config = await caller.config.getByKey({ key: "test_config" });
    expect(config).toBeDefined();
    expect(config?.configValue).toBe("test_value");
    expect(config?.description).toBe("测试配置");
  });

  it("应该能够更新已存在的配置", async () => {
    // 创建初始配置
    await caller.config.upsert({
      key: "business_start_time",
      value: "09:00",
      description: "营业开始时间",
    });

    // 更新配置
    await caller.config.upsert({
      key: "business_start_time",
      value: "10:00",
      description: "营业开始时间（已更新）",
    });

    const config = await caller.config.getByKey({ key: "business_start_time" });
    expect(config?.configValue).toBe("10:00");
    expect(config?.description).toBe("营业开始时间（已更新）");
  });

  it("应该能够获取所有配置", async () => {
    // 创建多个配置
    await caller.config.upsert({
      key: "business_start_time",
      value: "09:00",
      description: "营业开始时间",
    });

    await caller.config.upsert({
      key: "business_end_time",
      value: "23:00",
      description: "营业结束时间",
    });

    await caller.config.upsert({
      key: "time_slot_minutes",
      value: "30",
      description: "时间槽间隔",
    });

    const configs = await caller.config.getAll();
    expect(configs).toHaveLength(3);
    expect(configs.map(c => c.configKey)).toContain("business_start_time");
    expect(configs.map(c => c.configKey)).toContain("business_end_time");
    expect(configs.map(c => c.configKey)).toContain("time_slot_minutes");
  });

  it("应该能够根据键获取配置", async () => {
    await caller.config.upsert({
      key: "buffer_time_minutes",
      value: "15",
      description: "缓冲时间",
    });

    const config = await caller.config.getByKey({ key: "buffer_time_minutes" });
    expect(config).toBeDefined();
    expect(config?.configValue).toBe("15");
  });

  it("查询不存在的配置应该返回undefined", async () => {
    const config = await caller.config.getByKey({ key: "non_existent_key" });
    expect(config).toBeUndefined();
  });

  it("应该能够管理预约视图风格配置", async () => {
    // 设置为表格视图
    await caller.config.upsert({
      key: "reservation_view_style",
      value: "table",
      description: "预约视图风格",
    });

    let config = await caller.config.getByKey({ key: "reservation_view_style" });
    expect(config?.configValue).toBe("table");

    // 切换为时间轴视图
    await caller.config.upsert({
      key: "reservation_view_style",
      value: "timeline",
      description: "预约视图风格",
    });

    config = await caller.config.getByKey({ key: "reservation_view_style" });
    expect(config?.configValue).toBe("timeline");
  });

  it("应该能够管理完整的营业时间配置", async () => {
    // 设置营业时间
    await caller.config.upsert({
      key: "business_start_time",
      value: "09:00",
      description: "营业开始时间",
    });

    await caller.config.upsert({
      key: "business_end_time",
      value: "22:00",
      description: "营业结束时间",
    });

    await caller.config.upsert({
      key: "time_slot_minutes",
      value: "30",
      description: "时间槽间隔（分钟）",
    });

    await caller.config.upsert({
      key: "buffer_time_minutes",
      value: "15",
      description: "缓冲时间（分钟）",
    });

    const configs = await caller.config.getAll();
    expect(configs).toHaveLength(4);

    const startTime = configs.find(c => c.configKey === "business_start_time");
    const endTime = configs.find(c => c.configKey === "business_end_time");
    const slotMinutes = configs.find(c => c.configKey === "time_slot_minutes");
    const bufferMinutes = configs.find(c => c.configKey === "buffer_time_minutes");

    expect(startTime?.configValue).toBe("09:00");
    expect(endTime?.configValue).toBe("22:00");
    expect(slotMinutes?.configValue).toBe("30");
    expect(bufferMinutes?.configValue).toBe("15");
  });
});
