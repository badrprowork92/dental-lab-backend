import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from "../../shared/const.js";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { validateLabSession } from "../db";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

const requireLabSession = t.middleware(async (opts) => {
  if (!opts.ctx.labSession) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "يرجى تسجيل الدخول للمتابعة." });
  }
  try {
    const session = await validateLabSession(opts.ctx.labSession);
    return opts.next({ ctx: { ...opts.ctx, labSession: session } });
  } catch (error) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: error instanceof Error ? error.message : "انتهت صلاحية الجلسة." });
  }
});

const labSessionProcedure = t.procedure.use(requireLabSession);
const requirePasswordChange = t.middleware(async (opts) => {
  const session = opts.ctx.labSession;
  if (!session) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "يرجى تسجيل الدخول للمتابعة." });
  }
  if (session.mustChangePassword) {
    throw new TRPCError({ code: "FORBIDDEN", message: "يجب تغيير كلمة المرور المؤقتة قبل متابعة استخدام التطبيق." });
  }
  return opts.next({ ctx: { ...opts.ctx, labSession: session } });
});

export const labProcedure = labSessionProcedure.use(requirePasswordChange);
export const labPasswordProcedure = labSessionProcedure;

export const labAdminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    if (!opts.ctx.labSession || opts.ctx.labSession.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "هذه العملية متاحة للمسؤول فقط." });
    }
    try {
      const session = await validateLabSession(opts.ctx.labSession);
      return opts.next({ ctx: { ...opts.ctx, labSession: session } });
    } catch (error) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: error instanceof Error ? error.message : "انتهت صلاحية الجلسة." });
    }
  }),
);

export const adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
