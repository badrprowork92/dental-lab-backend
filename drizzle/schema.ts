import {
  boolean,
  decimal,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

/** حساب المنصة الجاهز، ويُحافظ عليه منفصلًا عن حسابات تطبيق المختبر. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/** جهة اشتراك مستقلة. قائمة الأجهزة تسجل فعليًا في جدول labDevices بدل تخزينها كنص قابل للتلاعب. */
export const labs = mysqlTable(
  "labs",
  {
    id: int("id").autoincrement().primaryKey(),
    labCode: varchar("labCode", { length: 40 }).notNull(),
    displayName: varchar("displayName", { length: 150 }).notNull(),
    isActive: boolean("isActive").default(true).notNull(),
    maxDevices: int("maxDevices").default(1).notNull(),
    subscriptionStartDate: varchar("subscriptionStartDate", { length: 10 }),
    subscriptionEndDate: varchar("subscriptionEndDate", { length: 10 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({ labCodeUnique: uniqueIndex("labs_code_unique").on(table.labCode) }),
);

/** حسابات دخول التطبيق: مسؤول المنصة أو مستخدم مختبر محدود الصلاحيات. */
export const labUsers = mysqlTable(
  "labUsers",
  {
    id: int("id").autoincrement().primaryKey(),
    labId: int("labId").references(() => labs.id, { onDelete: "cascade" }),
    username: varchar("username", { length: 80 }).notNull(),
    email: varchar("email", { length: 320 }),
    passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
    role: mysqlEnum("role", ["admin", "lab_user"]).default("lab_user").notNull(),
    isActive: boolean("isActive").default(true).notNull(),
    sessionVersion: int("sessionVersion").default(1).notNull(),
    mustChangePassword: boolean("mustChangePassword").default(false).notNull(),
    maxDevices: int("maxDevices").default(1).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    lastSignedIn: timestamp("lastSignedIn"),
  },
  (table) => ({
    usernameUnique: uniqueIndex("lab_users_username_unique").on(table.username),
    emailUnique: uniqueIndex("lab_users_email_unique").on(table.email),
    labIndex: index("lab_users_lab_idx").on(table.labId),
  }),
);

/** سجل الأجهزة المعتمدة لكل مختبر؛ يحفظ بصمة فقط ولا يحفظ أي بيانات شخصية للجهاز. */
export const labDevices = mysqlTable(
  "labDevices",
  {
    id: int("id").autoincrement().primaryKey(),
    labId: int("labId").notNull().references(() => labs.id, { onDelete: "cascade" }),
    deviceFingerprint: varchar("deviceFingerprint", { length: 128 }).notNull(),
    deviceLabel: varchar("deviceLabel", { length: 120 }),
    registeredAt: timestamp("registeredAt").defaultNow().notNull(),
    lastSeenAt: timestamp("lastSeenAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    labDeviceUnique: uniqueIndex("lab_devices_lab_fingerprint_unique").on(table.labId, table.deviceFingerprint),
    labDeviceIndex: index("lab_devices_lab_idx").on(table.labId),
  }),
);

/** العملات المعتمدة في المختبر وأسعار تحويلها إلى العملة الأساسية. */
export const labCurrencies = mysqlTable(
  "labCurrencies",
  {
    id: int("id").autoincrement().primaryKey(),
    labId: int("labId").notNull().references(() => labs.id, { onDelete: "cascade" }),
    currencyCode: varchar("currencyCode", { length: 3 }).notNull(),
    displayName: varchar("displayName", { length: 40 }).notNull(),
    symbol: varchar("symbol", { length: 12 }).notNull(),
    exchangeRate: decimal("exchangeRate", { precision: 18, scale: 6 }).default("1.000000").notNull(),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    labCurrencyUnique: uniqueIndex("lab_currency_unique").on(table.labId, table.currencyCode),
    labCurrencyIndex: index("lab_currency_lab_idx").on(table.labId),
  }),
);

/** الأطباء والعيادات. */
export const clients = mysqlTable(
  "clients",
  {
    id: int("id").autoincrement().primaryKey(),
    labId: int("labId").notNull().references(() => labs.id, { onDelete: "cascade" }),
    doctorName: varchar("doctorName", { length: 100 }).notNull(),
    clinicName: varchar("clinicName", { length: 100 }).notNull(),
    phoneNumber: varchar("phoneNumber", { length: 20 }),
    creditLimit: decimal("creditLimit", { precision: 12, scale: 2 }).default("0.00").notNull(),
    currentBalance: decimal("currentBalance", { precision: 12, scale: 2 }).default("0.00").notNull(),
    defaultCurrencyCode: varchar("defaultCurrencyCode", { length: 3 }).default("YER").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    labIndex: index("clients_lab_idx").on(table.labId),
    clinicIndex: index("clients_clinic_idx").on(table.labId, table.clinicName),
  }),
);

/** بيانات المختبر التي تظهر في ترويسة التقارير. */
export const labSettings = mysqlTable(
  "labSettings",
  {
    id: int("id").primaryKey(),
    labId: int("labId").notNull().references(() => labs.id, { onDelete: "cascade" }),
    labName: varchar("labName", { length: 150 }).default("").notNull(),
    phoneNumber: varchar("phoneNumber", { length: 30 }).default("").notNull(),
    location: varchar("location", { length: 255 }).default("").notNull(),
    headerNote1: varchar("headerNote1", { length: 255 }).default("").notNull(),
    headerNote2: varchar("headerNote2", { length: 255 }).default("").notNull(),
    headerNote3: varchar("headerNote3", { length: 255 }).default("").notNull(),
    logoUrl: text("logoUrl"),
    baseCurrencyCode: varchar("baseCurrencyCode", { length: 3 }).default("YER").notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({ labUnique: uniqueIndex("lab_settings_lab_unique").on(table.labId) }),
);

export const cashboxes = mysqlTable(
  "cashboxes",
  {
    id: int("id").autoincrement().primaryKey(),
    labId: int("labId").notNull().references(() => labs.id, { onDelete: "cascade" }),
    cashboxName: varchar("cashboxName", { length: 100 }).notNull(),
    currencyCode: varchar("currencyCode", { length: 3 }).default("YER").notNull(),
    openingBalance: decimal("openingBalance", { precision: 18, scale: 2 }).default("0.00").notNull(),
    currentBalance: decimal("currentBalance", { precision: 18, scale: 2 }).default("0.00").notNull(),
    actualBalance: decimal("actualBalance", { precision: 18, scale: 2 }).default("0.00").notNull(),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({ cashboxNameIndex: index("cashboxes_lab_name_idx").on(table.labId, table.cashboxName), cashboxLabIndex: index("cashboxes_lab_idx").on(table.labId) }),
);

export const cashboxTransfers = mysqlTable(
  "cashboxTransfers",
  {
    id: int("id").autoincrement().primaryKey(),
    labId: int("labId").notNull().references(() => labs.id, { onDelete: "cascade" }),
    fromCashboxId: int("fromCashboxId").notNull().references(() => cashboxes.id, { onDelete: "restrict" }),
    toCashboxId: int("toCashboxId").notNull().references(() => cashboxes.id, { onDelete: "restrict" }),
    transferDate: varchar("transferDate", { length: 10 }).notNull(),
    amount: decimal("amount", { precision: 18, scale: 2 }).notNull(),
    currencyCode: varchar("currencyCode", { length: 3 }).default("YER").notNull(),
    exchangeRate: decimal("exchangeRate", { precision: 18, scale: 6 }).default("1.000000").notNull(),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({ transferLabDateIndex: index("cashbox_transfers_lab_date_idx").on(table.labId, table.transferDate), transferFromIndex: index("cashbox_transfers_from_idx").on(table.fromCashboxId), transferToIndex: index("cashbox_transfers_to_idx").on(table.toCashboxId) }),
);

export const suppliers = mysqlTable(
  "suppliers",
  {
    id: int("id").autoincrement().primaryKey(),
    labId: int("labId").notNull().references(() => labs.id, { onDelete: "cascade" }),
    supplierName: varchar("supplierName", { length: 150 }).notNull(),
    phoneNumber: varchar("phoneNumber", { length: 30 }),
    address: varchar("address", { length: 255 }),
    currentBalance: decimal("currentBalance", { precision: 12, scale: 2 }).default("0.00").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({ supplierNameIndex: index("suppliers_lab_name_idx").on(table.labId, table.supplierName) }),
);

export const supplierMaterials = mysqlTable(
  "supplierMaterials",
  {
    id: int("id").autoincrement().primaryKey(),
    labId: int("labId").notNull().references(() => labs.id, { onDelete: "cascade" }),
    supplierId: int("supplierId").notNull().references(() => suppliers.id, { onDelete: "restrict" }),
    materialDate: varchar("materialDate", { length: 10 }).notNull(),
    materialDescription: varchar("materialDescription", { length: 255 }).notNull(),
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    currencyCode: varchar("currencyCode", { length: 3 }).default("YER").notNull(),
    exchangeRate: decimal("exchangeRate", { precision: 18, scale: 6 }).default("1.000000").notNull(),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({ labDateIndex: index("supplier_material_lab_date_idx").on(table.labId, table.materialDate), supplierIndex: index("supplier_material_supplier_idx").on(table.supplierId) }),
);

export const supplierPayments = mysqlTable(
  "supplierPayments",
  {
    id: int("id").autoincrement().primaryKey(),
    labId: int("labId").notNull().references(() => labs.id, { onDelete: "cascade" }),
    supplierId: int("supplierId").notNull().references(() => suppliers.id, { onDelete: "restrict" }),
    paymentDate: varchar("paymentDate", { length: 10 }).notNull(),
    amountPaid: decimal("amountPaid", { precision: 12, scale: 2 }).notNull(),
    cashboxId: int("cashboxId").references(() => cashboxes.id, { onDelete: "restrict" }),
    currencyCode: varchar("currencyCode", { length: 3 }).default("YER").notNull(),
    exchangeRate: decimal("exchangeRate", { precision: 18, scale: 6 }).default("1.000000").notNull(),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({ labDateIndex: index("supplier_payment_lab_date_idx").on(table.labId, table.paymentDate), supplierIndex: index("supplier_payment_supplier_idx").on(table.supplierId) }),
);

export const technicians = mysqlTable(
  "technicians",
  {
    id: int("id").autoincrement().primaryKey(),
    labId: int("labId").notNull().references(() => labs.id, { onDelete: "cascade" }),
    techName: varchar("techName", { length: 100 }).notNull(),
    specialty: varchar("specialty", { length: 50 }).notNull(),
    commissionType: mysqlEnum("commissionType", ["fixed_per_tooth", "percentage"]).notNull(),
    commissionRate: decimal("commissionRate", { precision: 10, scale: 2 }).default("0.00").notNull(),
    currentBalance: decimal("currentBalance", { precision: 12, scale: 2 }).default("0.00").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({ techNameIndex: index("technicians_lab_name_idx").on(table.labId, table.techName) }),
);

export const services = mysqlTable(
  "services",
  {
    id: int("id").autoincrement().primaryKey(),
    labId: int("labId").notNull().references(() => labs.id, { onDelete: "cascade" }),
    category: varchar("category", { length: 100 }).notNull(),
    serviceName: varchar("serviceName", { length: 100 }).notNull(),
    basePrice: decimal("basePrice", { precision: 12, scale: 2 }).default("0.00").notNull(),
    urgentPrice: decimal("urgentPrice", { precision: 12, scale: 2 }).default("0.00").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({ serviceCategoryIndex: index("services_lab_category_idx").on(table.labId, table.category) }),
);

export const technicianRates = mysqlTable(
  "technicianRates",
  {
    id: int("id").autoincrement().primaryKey(),
    labId: int("labId").notNull().references(() => labs.id, { onDelete: "cascade" }),
    technicianId: int("technicianId").notNull().references(() => technicians.id, { onDelete: "cascade" }),
    serviceId: int("serviceId").notNull().references(() => services.id, { onDelete: "cascade" }),
    ratePerTooth: decimal("ratePerTooth", { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({ technicianServiceUnique: uniqueIndex("technician_service_unique").on(table.technicianId, table.serviceId) }),
);

export const orders = mysqlTable(
  "orders",
  {
    id: int("id").autoincrement().primaryKey(),
    labId: int("labId").notNull().references(() => labs.id, { onDelete: "cascade" }),
    invoiceNumber: varchar("invoiceNumber", { length: 50 }).notNull(),
    clientId: int("clientId").notNull().references(() => clients.id, { onDelete: "restrict" }),
    patientName: varchar("patientName", { length: 100 }),
    orderDate: varchar("orderDate", { length: 10 }).notNull(),
    caseMonth: varchar("caseMonth", { length: 7 }).notNull(),
    orderType: mysqlEnum("orderType", ["normal", "urgent", "adjustment"]).default("normal").notNull(),
    serviceId: int("serviceId").notNull().references(() => services.id, { onDelete: "restrict" }),
    upperRight: varchar("upperRight", { length: 50 }).default("").notNull(),
    upperLeft: varchar("upperLeft", { length: 50 }).default("").notNull(),
    lowerRight: varchar("lowerRight", { length: 50 }).default("").notNull(),
    lowerLeft: varchar("lowerLeft", { length: 50 }).default("").notNull(),
    teethCount: int("teethCount").default(0).notNull(),
    unitPrice: decimal("unitPrice", { precision: 12, scale: 2 }).notNull(),
    currencyCode: varchar("currencyCode", { length: 3 }).default("YER").notNull(),
    exchangeRate: decimal("exchangeRate", { precision: 18, scale: 6 }).default("1.000000").notNull(),
    totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }).generatedAlwaysAs(sql`teethCount * unitPrice`, { mode: "stored" }),
    orderStatus: mysqlEnum("orderStatus", ["new", "in_progress", "completed", "delivered"]).default("new").notNull(),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    orderClientIndex: index("orders_client_idx").on(table.clientId),
    orderLabDateIndex: index("orders_lab_date_idx").on(table.labId, table.orderDate),
    orderStatusIndex: index("orders_status_idx").on(table.orderStatus),
    caseMonthNumberUnique: uniqueIndex("orders_lab_case_month_number_unique").on(table.labId, table.caseMonth, table.invoiceNumber),
  }),
);

export const orderTechnicians = mysqlTable(
  "orderTechnicians",
  {
    id: int("id").autoincrement().primaryKey(),
    labId: int("labId").notNull().references(() => labs.id, { onDelete: "cascade" }),
    orderId: int("orderId").notNull().references(() => orders.id, { onDelete: "cascade" }),
    technicianId: int("technicianId").notNull().references(() => technicians.id, { onDelete: "restrict" }),
    stageName: mysqlEnum("stageName", ["wax", "ceramic", "finishing", "fitting", "other"]).notNull(),
    assignedTeeth: int("assignedTeeth").notNull(),
    commissionEarned: decimal("commissionEarned", { precision: 10, scale: 2 }).default("0.00").notNull(),
    isCompleted: boolean("isCompleted").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({ assignmentOrderIndex: index("assignments_order_idx").on(table.orderId), assignmentTechIndex: index("assignments_tech_idx").on(table.technicianId), labIndex: index("assignments_lab_idx").on(table.labId) }),
);

export const payments = mysqlTable(
  "payments",
  {
    id: int("id").autoincrement().primaryKey(),
    labId: int("labId").notNull().references(() => labs.id, { onDelete: "cascade" }),
    receiptNumber: int("receiptNumber").notNull(),
    clientId: int("clientId").notNull().references(() => clients.id, { onDelete: "restrict" }),
    paymentDate: varchar("paymentDate", { length: 10 }).notNull(),
    amountPaid: decimal("amountPaid", { precision: 12, scale: 2 }).default("0.00").notNull(),
    discount: decimal("discount", { precision: 12, scale: 2 }).default("0.00").notNull(),
    paymentMethod: mysqlEnum("paymentMethod", ["cash", "bank", "pos"]).default("cash").notNull(),
    cashboxId: int("cashboxId").references(() => cashboxes.id, { onDelete: "restrict" }),
    currencyCode: varchar("currencyCode", { length: 3 }).default("YER").notNull(),
    exchangeRate: decimal("exchangeRate", { precision: 18, scale: 6 }).default("1.000000").notNull(),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({ paymentClientIndex: index("payments_client_idx").on(table.clientId), receiptUnique: uniqueIndex("payments_lab_receipt_unique").on(table.labId, table.receiptNumber) }),
);

export const technicianPayouts = mysqlTable(
  "technicianPayouts",
  {
    id: int("id").autoincrement().primaryKey(),
    labId: int("labId").notNull().references(() => labs.id, { onDelete: "cascade" }),
    technicianId: int("technicianId").notNull().references(() => technicians.id, { onDelete: "restrict" }),
    payoutDate: varchar("payoutDate", { length: 10 }).notNull(),
    amountPaid: decimal("amountPaid", { precision: 12, scale: 2 }).notNull(),
    payoutType: mysqlEnum("payoutType", ["payment", "advance", "bonus"]).default("payment").notNull(),
    paymentMethod: mysqlEnum("paymentMethod", ["cash", "bank", "pos"]).default("cash").notNull(),
    cashboxId: int("cashboxId").references(() => cashboxes.id, { onDelete: "restrict" }),
    currencyCode: varchar("currencyCode", { length: 3 }).default("YER").notNull(),
    exchangeRate: decimal("exchangeRate", { precision: 18, scale: 6 }).default("1.000000").notNull(),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({ payoutTechIndex: index("payouts_tech_idx").on(table.technicianId), labIndex: index("payouts_lab_idx").on(table.labId) }),
);

export const technicianWorkEntries = mysqlTable(
  "technicianWorkEntries",
  {
    id: int("id").autoincrement().primaryKey(),
    labId: int("labId").notNull().references(() => labs.id, { onDelete: "cascade" }),
    technicianId: int("technicianId").notNull().references(() => technicians.id, { onDelete: "restrict" }),
    workDate: varchar("workDate", { length: 10 }).notNull(),
    piecesCount: int("piecesCount").notNull(),
    unitRate: decimal("unitRate", { precision: 12, scale: 2 }).notNull(),
    currencyCode: varchar("currencyCode", { length: 3 }).default("YER").notNull(),
    exchangeRate: decimal("exchangeRate", { precision: 18, scale: 6 }).default("1.000000").notNull(),
    totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }).generatedAlwaysAs(sql`piecesCount * unitRate`, { mode: "stored" }),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({ workTechnicianIndex: index("technician_work_technician_idx").on(table.technicianId), workLabDateIndex: index("technician_work_lab_date_idx").on(table.labId, table.workDate) }),
);

export const expenses = mysqlTable(
  "expenses",
  {
    id: int("id").autoincrement().primaryKey(),
    labId: int("labId").notNull().references(() => labs.id, { onDelete: "cascade" }),
    category: varchar("category", { length: 50 }).notNull(),
    costType: mysqlEnum("costType", ["materials", "wages", "rent", "installments", "utilities", "other"]).default("other").notNull(),
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    cashboxId: int("cashboxId").references(() => cashboxes.id, { onDelete: "restrict" }),
    currencyCode: varchar("currencyCode", { length: 3 }).default("YER").notNull(),
    exchangeRate: decimal("exchangeRate", { precision: 18, scale: 6 }).default("1.000000").notNull(),
    expenseDate: varchar("expenseDate", { length: 10 }).notNull(),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({ expenseDateIndex: index("expenses_lab_date_idx").on(table.labId, table.expenseDate) }),
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Lab = typeof labs.$inferSelect;
export type LabUser = typeof labUsers.$inferSelect;
export type LabDevice = typeof labDevices.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type Technician = typeof technicians.$inferSelect;
export type Service = typeof services.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type LabSettings = typeof labSettings.$inferSelect;
export type Cashbox = typeof cashboxes.$inferSelect;
export type CashboxTransfer = typeof cashboxTransfers.$inferSelect;
export type TechnicianWorkEntry = typeof technicianWorkEntries.$inferSelect;
export type Supplier = typeof suppliers.$inferSelect;
export type SupplierMaterial = typeof supplierMaterials.$inferSelect;
export type SupplierPayment = typeof supplierPayments.$inferSelect;
