import { z } from "zod";

import { COOKIE_NAME } from "../shared/const";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { labAdminProcedure, labPasswordProcedure, labProcedure, publicProcedure, router } from "./_core/trpc";

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "يجب إدخال تاريخ صحيح.");
const moneyString = z.coerce.number().min(0).transform((value) => value.toFixed(2));
const costType = z.enum(["materials", "wages", "rent", "installments", "utilities", "other"]);
const currencyCode = z.enum(["YER", "SAR", "USD"]);
const requireLabId = (session: { labId: number | null }) => {
  if (!session.labId) throw new Error("حساب المسؤول لا يدير البيانات اليومية لمختبر بعينه.");
  return session.labId;
};

const profileInput = z.object({
  labName: z.string().trim().min(2).max(150),
  phoneNumber: z.string().trim().max(30).optional(),
  location: z.string().trim().max(255).optional(),
  headerNote1: z.string().trim().max(255).optional(),
  headerNote2: z.string().trim().max(255).optional(),
  headerNote3: z.string().trim().max(255).optional(),
  baseCurrencyCode: currencyCode.optional(),
  logoBase64: z.string().max(1_400_000).optional(),
  logoMime: z.enum(["image/jpeg", "image/png", "image/webp"]).optional(),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  license: router({
    status: publicProcedure.query(async () => ({ adminReady: await db.hasPlatformAdmin() })),
    verifySetupCode: publicProcedure
      .input(z.object({ setupCode: z.string().min(12).max(256) }))
      .mutation(({ input }) => ({ valid: input.setupCode === process.env.LAB_ADMIN_SETUP_CODE })),
    bootstrapAdmin: publicProcedure
      .input(z.object({ username: z.string().trim().min(3).max(80), email: z.string().trim().email().max(320).optional(), password: z.string().min(10).max(128), setupCode: z.string().min(12).max(256) }))
      .mutation(({ input }) => db.bootstrapAdmin(input)),
    resetAdminEmergency: publicProcedure
      .input(z.object({ emergencyCode: z.string().min(10).max(256), password: z.string().min(10).max(128) }))
      .mutation(({ input }) => db.resetPlatformAdminEmergency(input)),
    login: publicProcedure
      .input(z.object({ credential: z.string().trim().min(3).max(320), password: z.string().min(1).max(128), deviceId: z.string().trim().min(8).max(256), deviceLabel: z.string().trim().max(120).optional() }))
      .mutation(async ({ input }) => {
        try {
          return await db.authenticateLabUser(input);
        } catch (error) {
          const message = error instanceof Error && error.message ? error.message : "تعذر تسجيل الدخول.";
          throw new TRPCError({ code: "UNAUTHORIZED", message });
        }
      }),
    session: labProcedure.query(({ ctx }) => db.validateLabSession(ctx.labSession)),
  }),
  admin: router({
    labs: labAdminProcedure.query(() => db.listLabsAdmin()),
    createLab: labAdminProcedure
      .input(z.object({ labCode: z.string().trim().regex(/^[a-z0-9-]{3,40}$/), displayName: z.string().trim().min(2).max(150), maxDevices: z.number().int().min(1).max(20), username: z.string().trim().min(3).max(80), email: z.string().trim().email().max(320).optional(), password: z.string().min(10).max(128), subscriptionStartDate: dateString.optional(), subscriptionEndDate: dateString.optional() }))
      .mutation(({ input }) => db.createLabAdmin(input)),
    updateLab: labAdminProcedure
      .input(z.object({ id: z.number().int().positive(), displayName: z.string().trim().min(2).max(150), isActive: z.boolean(), maxDevices: z.number().int().min(1).max(20), subscriptionStartDate: dateString.nullable().optional(), subscriptionEndDate: dateString.nullable().optional() }))
      .mutation(({ input }) => db.updateLabAdmin(input)),
    profile: labAdminProcedure.input(z.object({ labId: z.number().int().positive() })).query(({ input }) => db.getLabProfile(input.labId)),
    updateProfile: labAdminProcedure.input(z.object({ labId: z.number().int().positive(), profile: profileInput })).mutation(({ input }) => db.updateLabProfile(input.labId, input.profile)),
    currencies: labAdminProcedure.input(z.object({ labId: z.number().int().positive() })).query(({ input }) => db.listCurrencies(input.labId)),
    updateCurrency: labAdminProcedure.input(z.object({ labId: z.number().int().positive(), currencyCode, exchangeRate: z.coerce.number().positive().transform((value) => value.toFixed(6)), isActive: z.boolean() })).mutation(({ input }) => db.updateCurrency(input.labId, input)),
    devices: labAdminProcedure.input(z.object({ labId: z.number().int().positive() })).query(({ input }) => db.listLabDevicesAdmin(input.labId)),
    removeDevice: labAdminProcedure.input(z.object({ labId: z.number().int().positive(), id: z.number().int().positive() })).mutation(({ input }) => db.removeLabDeviceAdmin(input.labId, input.id)),
    labUsers: labAdminProcedure.input(z.object({ labId: z.number().int().positive() })).query(({ input }) => db.listLabUsersAdmin(input.labId)),
      createLabUser: labAdminProcedure.input(z.object({ labId: z.number().int().positive(), username: z.string().trim().min(3).max(80), email: z.string().trim().email().max(320).optional(), password: z.string().min(10).max(128), maxDevices: z.number().int().min(1).max(20).optional() })).mutation(({ input }) => db.createLabUserAdmin(input)),
    resetLabUserPassword: labAdminProcedure.input(z.object({ labId: z.number().int().positive(), userId: z.number().int().positive(), password: z.string().min(10).max(128) })).mutation(({ input }) => db.resetLabUserPasswordAdmin(input)),
    setLabUserActive: labAdminProcedure.input(z.object({ labId: z.number().int().positive(), userId: z.number().int().positive(), isActive: z.boolean() })).mutation(({ input }) => db.setLabUserActiveAdmin(input)),
    deleteSuspendedLabUser: labAdminProcedure.input(z.object({ labId: z.number().int().positive(), userId: z.number().int().positive() })).mutation(({ input }) => db.deleteSuspendedLabUserAdmin(input)),
  }),
  lab: router({
    bootstrap: labProcedure.query(({ ctx }) => db.getBootstrapData(requireLabId(ctx.labSession))),
    dashboard: labProcedure.query(({ ctx }) => db.getDashboard(requireLabId(ctx.labSession))),
    profile: router({
      get: labProcedure.query(({ ctx }) => db.getLabProfile(requireLabId(ctx.labSession))),
      update: labAdminProcedure.input(profileInput).mutation(({ ctx, input }) => db.updateLabProfile(requireLabId(ctx.labSession), input)),
    }),
    account: router({
      changePassword: labPasswordProcedure.input(z.object({ currentPassword: z.string().min(1).max(128), newPassword: z.string().min(10).max(128) })).mutation(({ ctx, input }) => db.changeOwnPassword(ctx.labSession, input)),
    }),
    currencies: router({
      list: labProcedure.query(({ ctx }) => db.listCurrencies(requireLabId(ctx.labSession))),
      update: labProcedure.input(z.object({ currencyCode, exchangeRate: z.coerce.number().positive().transform((value) => value.toFixed(6)), isActive: z.boolean() })).mutation(({ ctx, input }) => db.updateCurrency(requireLabId(ctx.labSession), input)),
    }),
    cashboxes: router({
      list: labProcedure.query(({ ctx }) => db.listCashboxes(requireLabId(ctx.labSession))),
      transfers: labProcedure.query(({ ctx }) => db.listCashboxTransfers(requireLabId(ctx.labSession))),
      create: labProcedure.input(z.object({ cashboxName: z.string().trim().min(2).max(100), currencyCode, openingBalance: moneyString, actualBalance: moneyString.optional() })).mutation(({ ctx, input }) => db.createCashbox(requireLabId(ctx.labSession), input)),
      update: labProcedure.input(z.object({ id: z.number().int().positive(), cashboxName: z.string().trim().min(2).max(100), currencyCode, openingBalance: moneyString, actualBalance: moneyString, isActive: z.boolean() })).mutation(({ ctx, input }) => db.updateCashbox(requireLabId(ctx.labSession), input.id, input)),
      setActualBalance: labProcedure.input(z.object({ id: z.number().int().positive(), actualBalance: moneyString })).mutation(({ ctx, input }) => db.setCashboxActualBalance(requireLabId(ctx.labSession), input.id, input.actualBalance)),
      createTransfer: labProcedure.input(z.object({ fromCashboxId: z.number().int().positive(), toCashboxId: z.number().int().positive(), transferDate: dateString, amount: moneyString, currencyCode, notes: z.string().max(1000).optional() })).mutation(({ ctx, input }) => db.createCashboxTransfer(requireLabId(ctx.labSession), input)),
      deleteTransfer: labProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => db.deleteCashboxTransfer(requireLabId(ctx.labSession), input.id)),
    }),
    clients: router({
      list: labProcedure.query(({ ctx }) => db.listClients(requireLabId(ctx.labSession))),
      byId: labProcedure.input(z.object({ id: z.number().int().positive() })).query(({ ctx, input }) => db.getClient(requireLabId(ctx.labSession), input.id)),
      create: labProcedure.input(z.object({ doctorName: z.string().trim().min(2).max(100), clinicName: z.string().trim().min(2).max(100), phoneNumber: z.string().max(20).optional(), creditLimit: moneyString.optional(), defaultCurrencyCode: currencyCode.optional() })).mutation(({ ctx, input }) => db.createClient(requireLabId(ctx.labSession), input)),
      update: labProcedure.input(z.object({ id: z.number().int().positive(), doctorName: z.string().trim().min(2).max(100), clinicName: z.string().trim().min(2).max(100), phoneNumber: z.string().max(20).optional(), creditLimit: moneyString.optional() })).mutation(({ ctx, input }) => db.updateClient(requireLabId(ctx.labSession), input.id, input)),
      delete: labProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => db.deleteClient(requireLabId(ctx.labSession), input.id)),
    }),
    services: router({
      list: labProcedure.query(({ ctx }) => db.listServices(requireLabId(ctx.labSession))),
      create: labProcedure.input(z.object({ category: z.string().trim().min(2).max(100), serviceName: z.string().trim().min(2).max(100), basePrice: moneyString, urgentPrice: moneyString })).mutation(({ ctx, input }) => db.createService(requireLabId(ctx.labSession), input)),
      updatePrice: labProcedure.input(z.object({ id: z.number().int().positive(), basePrice: moneyString, urgentPrice: moneyString })).mutation(({ ctx, input }) => db.updateServicePrice(requireLabId(ctx.labSession), input.id, input)),
      delete: labProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => db.deleteService(requireLabId(ctx.labSession), input.id)),
    }),
    technicians: router({
      list: labProcedure.query(({ ctx }) => db.listTechnicians(requireLabId(ctx.labSession))),
      create: labProcedure.input(z.object({ techName: z.string().trim().min(2).max(100), specialty: z.string().trim().min(2).max(50), commissionType: z.enum(["fixed_per_tooth", "percentage"]), commissionRate: moneyString })).mutation(({ ctx, input }) => db.createTechnician(requireLabId(ctx.labSession), input)),
      delete: labProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => db.deleteTechnician(requireLabId(ctx.labSession), input.id)),
      setRate: labProcedure.input(z.object({ technicianId: z.number().int().positive(), serviceId: z.number().int().positive(), ratePerTooth: moneyString })).mutation(({ ctx, input }) => db.upsertTechnicianRate(requireLabId(ctx.labSession), input)),
      assign: labProcedure.input(z.object({ orderId: z.number().int().positive(), technicianId: z.number().int().positive(), stageName: z.enum(["wax", "ceramic", "finishing", "fitting", "other"]), assignedTeeth: z.number().int().positive() })).mutation(({ ctx, input }) => db.assignTechnician(requireLabId(ctx.labSession), input)),
      payout: labProcedure.input(z.object({ technicianId: z.number().int().positive(), payoutDate: dateString, amountPaid: moneyString, payoutType: z.enum(["payment", "advance", "bonus"]), paymentMethod: z.enum(["cash", "bank", "pos"]), cashboxId: z.number().int().positive(), currencyCode, notes: z.string().max(1000).optional() })).mutation(({ ctx, input }) => db.createTechnicianPayout(requireLabId(ctx.labSession), input)),
      payouts: router({
        list: labProcedure.input(z.object({ technicianId: z.number().int().positive().optional() }).optional()).query(({ ctx, input }) => db.listTechnicianPayouts(requireLabId(ctx.labSession), input?.technicianId)),
        update: labProcedure.input(z.object({ id: z.number().int().positive(), technicianId: z.number().int().positive(), payoutDate: dateString, amountPaid: moneyString, payoutType: z.enum(["payment", "advance", "bonus"]).default("payment"), paymentMethod: z.enum(["cash", "bank", "pos"]).default("cash"), cashboxId: z.number().int().positive(), currencyCode: currencyCode.default("YER"), notes: z.string().max(1000).optional() })).mutation(({ ctx, input }) => db.updateTechnicianPayout(requireLabId(ctx.labSession), input.id, input)),
        delete: labProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => db.deleteTechnicianPayout(requireLabId(ctx.labSession), input.id)),
      }),
      work: router({
        list: labProcedure.input(z.object({ technicianId: z.number().int().positive().optional() }).optional()).query(({ ctx, input }) => db.listTechnicianWorkEntries(requireLabId(ctx.labSession), input?.technicianId)),
        create: labProcedure.input(z.object({ technicianId: z.number().int().positive(), workDate: dateString, piecesCount: z.number().int().positive(), unitRate: moneyString, notes: z.string().max(1000).optional() })).mutation(({ ctx, input }) => db.createTechnicianWorkEntry(requireLabId(ctx.labSession), input)),
        update: labProcedure.input(z.object({ id: z.number().int().positive(), technicianId: z.number().int().positive(), workDate: dateString, piecesCount: z.number().int().positive(), unitRate: moneyString, notes: z.string().max(1000).optional() })).mutation(({ ctx, input }) => db.updateTechnicianWorkEntry(requireLabId(ctx.labSession), input.id, input)),
        delete: labProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => db.deleteTechnicianWorkEntry(requireLabId(ctx.labSession), input.id)),
      }),
    }),
    orders: router({
      list: labProcedure.input(z.object({ clientId: z.number().int().positive().optional() }).optional()).query(({ ctx, input }) => db.listOrders(requireLabId(ctx.labSession), input?.clientId)),
      byId: labProcedure.input(z.object({ id: z.number().int().positive() })).query(({ ctx, input }) => db.getOrder(requireLabId(ctx.labSession), input.id)),
      create: labProcedure.input(z.object({ invoiceNumber: z.string().trim().min(1).max(50), clientId: z.number().int().positive(), patientName: z.string().trim().max(100).optional(), orderDate: dateString, orderType: z.enum(["normal", "urgent", "adjustment"]), serviceId: z.number().int().positive(), upperRight: z.string().max(50).optional(), upperLeft: z.string().max(50).optional(), lowerRight: z.string().max(50).optional(), lowerLeft: z.string().max(50).optional(), teethCount: z.number().int().positive(), unitPrice: moneyString, currencyCode, notes: z.string().max(2000).optional() })).mutation(({ ctx, input }) => db.createOrder(requireLabId(ctx.labSession), input)),
      update: labProcedure.input(z.object({ id: z.number().int().positive(), invoiceNumber: z.string().trim().min(1).max(50), clientId: z.number().int().positive(), patientName: z.string().trim().max(100).optional(), orderDate: dateString, orderType: z.enum(["normal", "urgent", "adjustment"]), serviceId: z.number().int().positive(), upperRight: z.string().max(50).optional(), upperLeft: z.string().max(50).optional(), lowerRight: z.string().max(50).optional(), lowerLeft: z.string().max(50).optional(), teethCount: z.number().int().positive(), unitPrice: moneyString, currencyCode, notes: z.string().max(2000).optional() })).mutation(({ ctx, input }) => db.updateOrder(requireLabId(ctx.labSession), input.id, input)),
      updateStatus: labProcedure.input(z.object({ id: z.number().int().positive(), orderStatus: z.enum(["new", "in_progress", "completed", "delivered"]) })).mutation(({ ctx, input }) => db.updateOrderStatus(requireLabId(ctx.labSession), input.id, input.orderStatus)),
      delete: labProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => db.deleteOrder(requireLabId(ctx.labSession), input.id)),
    }),
    payments: router({
      list: labProcedure.input(z.object({ clientId: z.number().int().positive().optional() }).optional()).query(({ ctx, input }) => db.listPayments(requireLabId(ctx.labSession), input?.clientId)),
      create: labProcedure.input(z.object({ clientId: z.number().int().positive(), paymentDate: dateString, amountPaid: moneyString, discount: moneyString, paymentMethod: z.enum(["cash", "bank", "pos"]), cashboxId: z.number().int().positive(), currencyCode, notes: z.string().max(1000).optional() })).mutation(({ ctx, input }) => db.createPayment(requireLabId(ctx.labSession), input)),
      update: labProcedure.input(z.object({ id: z.number().int().positive(), clientId: z.number().int().positive(), paymentDate: dateString, amountPaid: moneyString, discount: moneyString, paymentMethod: z.enum(["cash", "bank", "pos"]), cashboxId: z.number().int().positive(), currencyCode: currencyCode.default("YER"), notes: z.string().max(1000).optional() })).mutation(({ ctx, input }) => db.updatePayment(requireLabId(ctx.labSession), input.id, input)),
      delete: labProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => db.deletePayment(requireLabId(ctx.labSession), input.id)),
    }),
    expenses: router({ list: labProcedure.query(({ ctx }) => db.listExpenses(requireLabId(ctx.labSession))), create: labProcedure.input(z.object({ category: z.string().trim().min(2).max(50), amount: moneyString, cashboxId: z.number().int().positive(), currencyCode: currencyCode.default("YER"), expenseDate: dateString, notes: z.string().max(1000).optional() })).mutation(({ ctx, input }) => db.createExpense(requireLabId(ctx.labSession), { ...input, costType: "other" })) }),
    costs: router({
      list: labProcedure.query(({ ctx }) => db.listExpenses(requireLabId(ctx.labSession))),
      create: labProcedure.input(z.object({ category: z.string().trim().min(2).max(50), costType, amount: moneyString, cashboxId: z.number().int().positive(), currencyCode, expenseDate: dateString, notes: z.string().max(1000).optional() })).mutation(({ ctx, input }) => db.createExpense(requireLabId(ctx.labSession), input)),
      update: labProcedure.input(z.object({ id: z.number().int().positive(), category: z.string().trim().min(2).max(50), costType, amount: moneyString, cashboxId: z.number().int().positive(), currencyCode: currencyCode.default("YER"), expenseDate: dateString, notes: z.string().max(1000).optional() })).mutation(({ ctx, input }) => db.updateExpense(requireLabId(ctx.labSession), input.id, input)),
      delete: labProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => db.deleteExpense(requireLabId(ctx.labSession), input.id)),
    }),
    suppliers: router({
      list: labProcedure.query(({ ctx }) => db.listSuppliers(requireLabId(ctx.labSession))),
      create: labProcedure.input(z.object({ supplierName: z.string().trim().min(2).max(150), phoneNumber: z.string().trim().max(30).optional(), address: z.string().trim().max(255).optional() })).mutation(({ ctx, input }) => db.createSupplier(requireLabId(ctx.labSession), input)),
      materials: router({
        list: labProcedure.input(z.object({ supplierId: z.number().int().positive().optional() }).optional()).query(({ ctx, input }) => db.listSupplierMaterials(requireLabId(ctx.labSession), input?.supplierId)),
        create: labProcedure.input(z.object({ supplierId: z.number().int().positive(), materialDate: dateString, materialDescription: z.string().trim().min(2).max(255), amount: moneyString, notes: z.string().max(1000).optional() })).mutation(({ ctx, input }) => db.createSupplierMaterial(requireLabId(ctx.labSession), input)),
        update: labProcedure.input(z.object({ id: z.number().int().positive(), supplierId: z.number().int().positive(), materialDate: dateString, materialDescription: z.string().trim().min(2).max(255), amount: moneyString, currencyCode: currencyCode.default("YER"), notes: z.string().max(1000).optional() })).mutation(({ ctx, input }) => db.updateSupplierMaterial(requireLabId(ctx.labSession), input.id, input)),
        delete: labProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => db.deleteSupplierMaterial(requireLabId(ctx.labSession), input.id)),
      }),
      payments: router({
        list: labProcedure.input(z.object({ supplierId: z.number().int().positive().optional() }).optional()).query(({ ctx, input }) => db.listSupplierPayments(requireLabId(ctx.labSession), input?.supplierId)),
        create: labProcedure.input(z.object({ supplierId: z.number().int().positive(), paymentDate: dateString, amountPaid: moneyString, cashboxId: z.number().int().positive(), currencyCode: currencyCode.default("YER"), notes: z.string().max(1000).optional() })).mutation(({ ctx, input }) => db.createSupplierPayment(requireLabId(ctx.labSession), input)),
        update: labProcedure.input(z.object({ id: z.number().int().positive(), supplierId: z.number().int().positive(), paymentDate: dateString, amountPaid: moneyString, cashboxId: z.number().int().positive(), currencyCode: currencyCode.default("YER"), notes: z.string().max(1000).optional() })).mutation(({ ctx, input }) => db.updateSupplierPayment(requireLabId(ctx.labSession), input.id, input)),
        delete: labProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => db.deleteSupplierPayment(requireLabId(ctx.labSession), input.id)),
      }),
    }),
    reports: router({
      doctorLedger: labProcedure.input(z.object({ clientId: z.number().int().positive(), startDate: dateString.optional(), endDate: dateString.optional(), currencyCode: currencyCode.optional() })).query(({ ctx, input }) => db.getDoctorLedger(requireLabId(ctx.labSession), input.clientId, input.startDate, input.endDate, input.currencyCode)),
      periodSummary: labProcedure.input(z.object({ startDate: dateString, endDate: dateString, currencyCode: currencyCode.optional() })).query(({ ctx, input }) => db.getPeriodSummary(requireLabId(ctx.labSession), input.startDate, input.endDate, input.currencyCode)),
      profitLoss: labProcedure.input(z.object({ startDate: dateString, endDate: dateString, currencyCode: currencyCode.optional(), cashboxId: z.number().int().positive().optional() })).query(({ ctx, input }) => db.getProfitLoss(requireLabId(ctx.labSession), input.startDate, input.endDate, input.currencyCode, input.cashboxId)),
      cashboxStatement: labProcedure.input(z.object({ cashboxId: z.number().int().positive(), startDate: dateString, endDate: dateString })).query(({ ctx, input }) => db.getCashboxStatement(requireLabId(ctx.labSession), input.cashboxId, input.startDate, input.endDate)),
      clientsWithOrders: labProcedure.input(z.object({ startDate: dateString, endDate: dateString })).query(({ ctx, input }) => db.listClientsWithOrders(requireLabId(ctx.labSession), input.startDate, input.endDate)),
      technicianLedger: labProcedure.input(z.object({ technicianId: z.number().int().positive(), startDate: dateString, endDate: dateString })).query(({ ctx, input }) => db.getTechnicianLedger(requireLabId(ctx.labSession), input.technicianId, input.startDate, input.endDate)),
      supplierLedger: labProcedure.input(z.object({ supplierId: z.number().int().positive(), startDate: dateString, endDate: dateString })).query(({ ctx, input }) => db.getSupplierLedger(requireLabId(ctx.labSession), input.supplierId, input.startDate, input.endDate)),
    }),
  }),
});

export type AppRouter = typeof appRouter;
