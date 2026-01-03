import { eq } from "drizzle-orm";
import { systemConfig, InsertSystemConfig } from "../drizzle/schema";
import { getDb } from "./db";

/**
 * 获取所有系统配置
 */
export async function getAllConfigs() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get configs: database not available");
    return [];
  }

  const result = await db.select().from(systemConfig);
  return result;
}

/**
 * 根据键获取配置
 */
export async function getConfigByKey(key: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get config: database not available");
    return undefined;
  }

  const result = await db.select().from(systemConfig).where(eq(systemConfig.configKey, key)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * 创建或更新配置
 */
export async function upsertConfig(key: string, value: string, description?: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert config: database not available");
    throw new Error("Database not available");
  }

  const existing = await getConfigByKey(key);
  
  if (existing) {
    // 更新现有配置
    const result = await db
      .update(systemConfig)
      .set({ configValue: value, description: description || existing.description })
      .where(eq(systemConfig.configKey, key));
    return result;
  } else {
    // 创建新配置
    const result = await db.insert(systemConfig).values({
      configKey: key,
      configValue: value,
      description,
    });
    return result;
  }
}

/**
 * 初始化默认配置
 */
export async function initDefaultConfigs() {
  const defaults = [
    {
      key: "business_start_time",
      value: "09:00",
      description: "营业开始时间（HH:mm格式）",
    },
    {
      key: "business_end_time",
      value: "23:00",
      description: "营业结束时间（HH:mm格式）",
    },
    {
      key: "buffer_time_minutes",
      value: "30",
      description: "预约后的缓冲时间（分钟）",
    },
    {
      key: "time_slot_minutes",
      value: "30",
      description: "时间槽间隔（分钟）",
    },
    {
      key: "reservation_view_style",
      value: "table",
      description: "预约视图风格（table=桌位在左侧, timeline=时间在左侧）",
    },
  ];

  for (const config of defaults) {
    const existing = await getConfigByKey(config.key);
    if (!existing) {
      await upsertConfig(config.key, config.value, config.description);
    }
  }
}
