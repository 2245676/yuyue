import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as tableDb from "./tableDb";

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
});

export type AppRouter = typeof appRouter;
