import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as tableDb from "./tableDb";
import * as reservationDb from "./reservationDb";
import * as configDb from "./configDb";
import { logger } from "./logger";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // 桌位管理路由
  table: router({
    // 获取所有桌位
    list: protectedProcedure.query(async () => {
      return await tableDb.getAllTables();
    }),
    
    // 获取所有可用桌位
    listActive: protectedProcedure.query(async () => {
      return await tableDb.getActiveTables();
    }),
    
    // 根据ID获取桌位
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await tableDb.getTableById(input.id);
      }),
    
    // 创建新桌位
    create: protectedProcedure
      .input(
        z.object({
          tableNumber: z.string().min(1).max(50),
          capacity: z.number().int().positive(),
          area: z.string().max(100).optional(),
          type: z.string().max(50).optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        await tableDb.createTable(input);
        return { success: true };
      }),
    
    // 更新桌位
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          tableNumber: z.string().min(1).max(50).optional(),
          capacity: z.number().int().positive().optional(),
          area: z.string().max(100).optional(),
          type: z.string().max(50).optional(),
          notes: z.string().optional(),
          isActive: z.number().int().min(0).max(1).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await tableDb.updateTable(id, data);
        return { success: true };
      }),
    
    // 删除桌位（软删除）
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await tableDb.deleteTable(input.id);
        return { success: true };
      }),
  }),

  // 预约管理路由
  reservation: router({
    // 获取所有预约
    list: protectedProcedure.query(async () => {
      return await reservationDb.getAllReservations();
    }),
    
    // 根据ID获取预约
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await reservationDb.getReservationById(input.id);
      }),
    
    // 根据日期范围获取预约
    getByDateRange: protectedProcedure
      .input(
        z.object({
          startDate: z.string().or(z.date()),
          endDate: z.string().or(z.date()),
        })
      )
      .query(async ({ input }) => {
        const startDate = typeof input.startDate === "string" ? new Date(input.startDate) : input.startDate;
        const endDate = typeof input.endDate === "string" ? new Date(input.endDate) : input.endDate;
        return await reservationDb.getReservationsByDateRange(startDate, endDate);
      }),
    
    // 根据桌位ID获取预约
    getByTableId: protectedProcedure
      .input(z.object({ tableId: z.number() }))
      .query(async ({ input }) => {
        return await reservationDb.getReservationsByTableId(input.tableId);
      }),
    
    // 根据状态获取预约
    getByStatus: protectedProcedure
      .input(z.object({ status: z.string() }))
      .query(async ({ input }) => {
        return await reservationDb.getReservationsByStatus(input.status);
      }),
    
    // 创建新预约
    create: protectedProcedure
      .input(
        z.object({
          tableId: z.number(),
          customerName: z.string().min(1).max(100),
          customerPhone: z.string().min(1).max(50),
          customerEmail: z.string().email().optional(),
          partySize: z.number().int().positive(),
          reservationTime: z.string().or(z.date()),
          duration: z.number().int().positive().default(120),
          status: z.string().max(20).default("pending"),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        try {
          logger.logApiRequest("POST", "/reservation/create", ctx.user?.id?.toString());
          
          const reservationTime = typeof input.reservationTime === "string" ? new Date(input.reservationTime) : input.reservationTime;
          
          // 检查时间冲突
          const hasConflict = await reservationDb.checkReservationConflict(
            input.tableId,
            reservationTime,
            input.duration
          );
          
          if (hasConflict) {
            logger.warn("预约时间冲突", { tableId: input.tableId, reservationTime, userId: ctx.user?.id?.toString() });
            throw new Error("该时间段已有预约，请选择其他时间");
          }
          
          await reservationDb.createReservation({
            ...input,
            reservationTime,
            createdBy: ctx.user?.id,
          });
          
          logger.info("预约创建成功", { tableId: input.tableId, userId: ctx.user?.id?.toString() });
          return { success: true };
        } catch (error) {
          logger.logApiError("POST", "/reservation/create", error as Error, ctx.user?.id?.toString());
          throw error;
        }
      }),
    
    // 更新预约
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          tableId: z.number().optional(),
          customerName: z.string().min(1).max(100).optional(),
          customerPhone: z.string().min(1).max(50).optional(),
          customerEmail: z.string().email().optional(),
          partySize: z.number().int().positive().optional(),
          reservationTime: z.string().or(z.date()).optional(),
          duration: z.number().int().positive().optional(),
          status: z.string().max(20).optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        
        // 如果更新了时间或桌位，检查冲突
        if (data.reservationTime || data.tableId || data.duration) {
          const existing = await reservationDb.getReservationById(id);
          if (existing) {
            const reservationTime = data.reservationTime 
              ? (typeof data.reservationTime === "string" ? new Date(data.reservationTime) : data.reservationTime)
              : existing.reservationTime;
            const tableId = data.tableId || existing.tableId;
            const duration = data.duration || existing.duration;
            
            const hasConflict = await reservationDb.checkReservationConflict(
              tableId,
              reservationTime,
              duration,
              id
            );
            
            if (hasConflict) {
              throw new Error("该时间段已有预约，请选择其他时间");
            }
          }
        }
        
        const updateData = {
          ...data,
          reservationTime: data.reservationTime 
            ? (typeof data.reservationTime === "string" ? new Date(data.reservationTime) : data.reservationTime)
            : undefined,
        };
        
        await reservationDb.updateReservation(id, updateData);
        return { success: true };
      }),
    
    // 删除预约
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await reservationDb.deleteReservation(input.id);
        return { success: true };
      }),
  }),

  // 系统配置路由
  config: router({
    // 获取所有配置
    getAll: protectedProcedure.query(async () => {
      return await configDb.getAllConfigs();
    }),
    
    // 根据键获取配置
    getByKey: protectedProcedure
      .input(z.object({ key: z.string() }))
      .query(async ({ input }) => {
        return await configDb.getConfigByKey(input.key);
      }),
    
    // 创建或更新配置
    upsert: protectedProcedure
      .input(
        z.object({
          key: z.string(),
          value: z.string(),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        await configDb.upsertConfig(input.key, input.value, input.description);
        return { success: true };
      }),
    
    // 初始化默认配置
    initDefaults: protectedProcedure.mutation(async () => {
      await configDb.initDefaultConfigs();
      return { success: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;
