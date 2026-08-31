# PROJECT_MASTER_DOCUMENTATION

> **حالة الوثيقة:** مرجع تشغيلي آمن مولّد في 2026-08-30 بواسطة Manus AI. لا تحتوي هذه الوثيقة على كلمات مرور أو رموز وصول أو مفاتيح طوارئ فعلية.

## 1. نظرة عامة

المشروع تطبيق Expo/React Native لإدارة حسابات مختبر الأسنان، مع Backend مبني على Express وtRPC وقاعدة بيانات MySQL متصلة عبر Drizzle ORM. يدعم النظام حساب مسؤول المنصة وحسابات مستخدمي المختبر، والصناديق والعملات YER/SAR/USD والتقارير وتسجيل الأجهزة.

## 2. البنية ومسارات التشغيل

| الجزء | المسار | الوظيفة |
|---|---|---|
| تطبيق الهاتف | `app/` | شاشات Expo Router وواجهات المستخدم |
| مكونات الواجهة | `components/` | عناصر UI المشتركة، ومنها التحديث والسحب |
| عميل API | `lib/trpc.ts` | عميل tRPC وإرسال الطلبات إلى Backend |
| المصادقة | `server/lab-auth.ts`, `server/db.ts` | التحقق من الحسابات والجلسات والأجهزة |
| الراوتر | `server/routers.ts` | مسارات tRPC والصلاحيات |
| قاعدة البيانات | `drizzle/schema.ts` | مخطط MySQL الكامل |
| الترحيلات | `drizzle/*.sql` | تغييرات المخطط القابلة لإعادة التطبيق |
| التقارير | `lib/pdf-reports.ts` | قوالب PDF العربية والمشاركة |

## 3. متغيرات البيئة والربط

القيم الفعلية تُدار في مدير الأسرار أو إعداد EAS ولا تُضمّن في الأرشيف. الأسماء التي يتوقعها المشروع هي:

| المتغير | التصنيف | الاستخدام |
|---|---|---|
| `BUILT_IN_FORGE_API_KEY` | secret | لا تُحفظ القيمة داخل هذا الملف |
| `BUILT_IN_FORGE_API_URL` | secret | لا تُحفظ القيمة داخل هذا الملف |
| `DATABASE_URL` | plain/config | لا تُحفظ القيمة داخل هذا الملف |
| `DRIZZLE_DATABASE_URL` | plain/config | لا تُحفظ القيمة داخل هذا الملف |
| `EXPO_APP_QR_URL` | secret | لا تُحفظ القيمة داخل هذا الملف |
| `EXPO_PACKAGER_PROXY_URL` | secret | لا تُحفظ القيمة داخل هذا الملف |
| `EXPO_PUBLIC_API_BASE_URL` | secret | لا تُحفظ القيمة داخل هذا الملف |
| `EXPO_PUBLIC_OAUTH_PORTAL_URL` | secret | لا تُحفظ القيمة داخل هذا الملف |
| `EXPO_PUBLIC_OAUTH_SERVER_URL` | secret | لا تُحفظ القيمة داخل هذا الملف |
| `EXPO_PUBLIC_OWNER_NAME` | secret | لا تُحفظ القيمة داخل هذا الملف |
| `EXPO_PUBLIC_OWNER_OPEN_ID` | secret | لا تُحفظ القيمة داخل هذا الملف |
| `EXPO_TOKEN` | secret | لا تُحفظ القيمة داخل هذا الملف |
| `JWT_SECRET` | secret | لا تُحفظ القيمة داخل هذا الملف |
| `LAB_ADMIN_EMERGENCY_CODE` | secret | لا تُحفظ القيمة داخل هذا الملف |
| `LAB_ADMIN_SETUP_CODE` | secret | لا تُحفظ القيمة داخل هذا الملف |
| `MANUS_WEBDEV_PROJECT_ID` | plain/config | لا تُحفظ القيمة داخل هذا الملف |
| `OAUTH_SERVER_URL` | secret | لا تُحفظ القيمة داخل هذا الملف |
| `OWNER_NAME` | secret | لا تُحفظ القيمة داخل هذا الملف |
| `OWNER_OPEN_ID` | secret | لا تُحفظ القيمة داخل هذا الملف |
| `REACT_NATIVE_PACKAGER_HOSTNAME` | secret | لا تُحفظ القيمة داخل هذا الملف |
| `VITE_ANALYTICS_ENDPOINT` | secret | لا تُحفظ القيمة داخل هذا الملف |
| `VITE_ANALYTICS_WEBSITE_ID` | secret | لا تُحفظ القيمة داخل هذا الملف |
| `VITE_APP_ID` | secret | لا تُحفظ القيمة داخل هذا الملف |
| `VITE_APP_LOGO` | secret | لا تُحفظ القيمة داخل هذا الملف |
| `VITE_APP_TITLE` | secret | لا تُحفظ القيمة داخل هذا الملف |
| `VITE_FRONTEND_FORGE_API_KEY` | secret | لا تُحفظ القيمة داخل هذا الملف |
| `VITE_FRONTEND_FORGE_API_URL` | secret | لا تُحفظ القيمة داخل هذا الملف |
| `VITE_OAUTH_PORTAL_URL` | secret | لا تُحفظ القيمة داخل هذا الملف |
| `EXPO_PUBLIC_API_BASE_URL` | public build variable | عنوان Backend الذي يضم `/api/trpc` ومسارات المصادقة |
| `VITE_FRONTEND_FORGE_API_URL` | public/config | عنوان Forge أو خدمة الواجهة عند الحاجة |

في EAS يجب ضبط `EXPO_PUBLIC_API_BASE_URL` في بيئة البناء نفسها، لأن قيمة `EXPO_PUBLIC_*` تُضمّن داخل حزمة التطبيق أثناء البناء. لا تستخدم `localhost` داخل APK مثبت على جهاز خارجي.

## 4. مخطط قاعدة البيانات الكامل

المصدر المعتمد للمخطط هو `drizzle/schema.ts` التالي:

```typescript
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

```

## 5. ترحيل حد الأجهزة لكل مستخدم

تمت إضافة العمود `labUsers.maxDevices` مع قيمة افتراضية `1`، وتمت تهيئة المستخدمين الحاليين من حد المختبر السابق. ملف الترحيل:

```sql
ALTER TABLE `labUsers`
  ADD COLUMN IF NOT EXISTS `maxDevices` INT NOT NULL DEFAULT 1;

UPDATE `labUsers` AS u
INNER JOIN `labs` AS l ON l.`id` = u.`labId`
SET u.`maxDevices` = l.`maxDevices`
WHERE u.`role` = 'lab_user'
  AND (u.`maxDevices` IS NULL OR u.`maxDevices` = 1);

CREATE INDEX IF NOT EXISTS `lab_users_max_devices_idx` ON `labUsers` (`labId`, `maxDevices`);

```

يجب تطبيق الترحيل على قاعدة الإنتاج مرة واحدة قبل تشغيل نسخة Backend التي تقرأ العمود الجديد. لا تستخدم `drizzle-kit migrate` على قاعدة تحتوي جداول موجودة إذا لم يكن سجل الترحيلات متزامناً؛ استخدم migration مُراجعاً أو طبّق ALTER idempotent عبر اتصال إداري.

## 6. مسارات Backend وAPI

المصدر الكامل للراوتر هو `server/routers.ts`:

```typescript
import { z } from "zod";

import { COOKIE_NAME } from "../shared/const";
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
      .mutation(({ input }) => db.authenticateLabUser(input)),
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

```

أهم المسارات الوظيفية هي `auth.labLogin` لتسجيل دخول مستخدم المختبر، `auth.me`/الجلسة لجلب الحساب الحالي، `lab.bootstrap` لتحميل بيانات المختبر، `lab.cashboxes.*` لإدارة الصناديق والتحويلات، `lab.reports.*` للتقارير ومنها `cashboxStatement`، `admin.*` لإدارة المختبرات والحسابات والأجهزة، و`lab.currencies.*` لإدارة العملات. جميع مسارات المختبر تتطلب جلسة مختبر صالحة، ومسارات الأدمن تتطلب دور `admin`.

## 7. المصادقة والأمان

تُخزّن كلمات المرور على هيئة hash ولا تُعرض نصياً. إعادة التعيين تتم من لوحة الأدمن وتُلغي الجلسات السابقة وتفرض تغيير كلمة المرور عند الدخول التالي. لا يجب إضافة كلمات المرور أو `DATABASE_URL` أو `EXPO_TOKEN` أو `LAB_ADMIN_SETUP_CODE` أو `COOKIE_SECRET` أو مفاتيح التخزين إلى Git أو إلى هذا الملف.

بيانات الطوارئ تُدار عبر مدير الأسرار باسم المتغير المناسب فقط. عند فقدانها، أنشئ قيمة جديدة ودوّرها ثم أعد تشغيل Backend؛ لا تضع القيمة داخل التطبيق أو الوثائق أو رسائل الفريق.

## 8. التشغيل المحلي

```bash
pnpm install
pnpm check
pnpm test
pnpm dev:server
```

يتطلب Backend المتغيرات السرية من مدير البيئة. للصحة استخدم `GET /api/health`، وللاختبار بعد تسجيل الدخول استخدم عميل tRPC أو شاشة التطبيق. لا تعتبر رابط expose مؤقتاً استضافة إنتاجية.

## 9. النشر الخارجي الدائم

يجب نشر Backend على خدمة دائمة تدعم Node.js 20+ أو أحدث، وتهيئة `DATABASE_URL` و`COOKIE_SECRET` ومتغيرات المصادقة والتخزين في مدير الأسرار. شغّل `pnpm build` ثم `pnpm start`، واجعل الخدمة تستمع إلى `0.0.0.0` والمنفذ الذي توفره المنصة عبر `PORT`. أضف health check إلى `/api/health`، فعّل HTTPS، واضبط CORS وDNS، ثم اختبر `auth.labLogin`, `lab.bootstrap`, `lab.cashboxes.list` و`lab.reports.cashboxStatement`.

بعد الحصول على عنوان HTTPS دائم:

```bash
eas env:create --environment preview --name EXPO_PUBLIC_API_BASE_URL --value https://BACKEND-DOMAIN.example --scope project
eas build --platform android --profile production
```

تختلف صيغة أمر EAS حسب إصدار CLI؛ راجع `eas env --help` قبل التنفيذ. لا تحفظ الرمز المميز في المشروع أو في سجل CI، واستخدم secret manager أو `EXPO_TOKEN` مؤقتاً.

## 10. البناء والإصدار

ملف `eas.json` يعرّف بناء `preview` كـ APK للاختبار. للإنتاج، أنشئ profile باسم `production` مع `android.buildType` المناسب، ثبّت `versionCode` متزايداً، وابنِ من commit محدد بعد نجاح الاختبارات. يجب تنزيل APK الناتج والتحقق من `file` و`unzip -t` قبل التوزيع.

## 11. النسخ الاحتياطي والتشغيل الآمن

قبل أي ترحيل إنتاجي، خذ نسخة احتياطية مشفرة من قاعدة البيانات. احتفظ بنسخة من ملف البيئة في مدير أسرار منفصل، ودوّر الرموز التي ظهرت في جلسات أو سجلات سابقة. لا تسمح بعرض كلمات المرور القديمة في لوحة الأدمن؛ استخدم إعادة تعيين لمرة واحدة فقط.

## 12. الملفات المرجعية

المصادر الأساسية هي `drizzle/schema.ts`, `server/routers.ts`, `server/db.ts`, `server/lab-auth.ts`, `lib/trpc.ts`, `lib/pdf-reports.ts`, `eas.json`, `app.config.ts`, و`drizzle/0009_user_device_limits.sql`. هذا الملف مرجع تشغيلي، بينما تبقى ملفات المصدر نفسها المرجع التنفيذي الوحيد.

## تحديث نهائي — 31 أغسطس 2026

تم إصلاح مسار `license.login` بحيث يحوّل أخطاء بيانات الدخول إلى `UNAUTHORIZED` مع استجابة tRPC/JSON وحالة HTTP 401 بدلاً من `INTERNAL_SERVER_ERROR`، كما أضيفت استجابة JSON موحدة لمسارات `/api` غير الموجودة لمنع صفحات HTML الافتراضية من Express. تم التحقق من الخادم العام عبر `GET /api/health`، ومن مسار login باختبار بيانات غير صحيحة؛ كلاهما يعيد JSON، مع بقاء الخادم على رابط المعاينة العام:

`https://3000-iegkigovufo4h4dqka49s-0c23a7e2.us2.manus.computer`

تم إنشاء APK إنتاجي ناجح عبر EAS بملف تعريف `production`، الإصدار `1.0.11`، ومعرّف البناء `1fe2078a-a7b3-4433-ab87-b29323106413`. رابط التنزيل المباشر موجود في قسم التسليم النهائي.

## تحديث الإصدار 1.0.13 — معالجة دورة الدخول بعد تسجيل الخروج

كشفت الاختبارات أن رابط Preview السابق كان منتهياً، وكان يعيد صفحة HTML عند انقطاع الوكيل، بينما يتوقع عميل tRPC JSON. تم تحديث متغير `EXPO_PUBLIC_API_BASE_URL` في EAS production إلى عنوان Backend النشط، وإضافة `resilientFetch` في `lib/trpc.ts` لإعادة المحاولة تلقائياً عند استلام HTML أو أخطاء 502، ثم إعادة خطأ JSON منظّم برسالة عربية عند تعذر الاتصال بعد المحاولات.

تم اجتياز فحص TypeScript وإنشاء APK production بالإصدار `1.0.13` عبر EAS. معرّف البناء هو `7c31069d-d622-4f8f-b97a-0368ca3cf03f`. عنوان Backend المستخدم في هذا الإصدار هو:

`https://3000-iegkigovufo4h4dqka49s-0c23a7e2.us2.manus.computer`

يظل هذا العنوان Preview Proxy مؤقتاً، وليس استضافة دائمة. عند نشر Backend على نطاق دائم، يجب تحديث متغير EAS وإعادة بناء APK.


## 13. النشر المُدار على Render

المشروع مناسب على Render كـ **Web Service** لأنه Backend Node.js/Express، وليس Static Site. أوامر المشروع الفعلية هي `pnpm install --frozen-lockfile` للبناء الاعتمادي، و`pnpm build` لإنتاج `dist/index.js`، ثم `pnpm start` لتشغيل الخادم الإنتاجي. يجب أن يستمع الخادم إلى `0.0.0.0` وأن يستخدم المنفذ الذي توفره Render عبر `PORT`.

### 13.1 المتطلبات من صاحب المشروع

أنشئ حساباً في Render، ثم اربط مستودع GitHub الذي يحتوي على هذا المصدر. لا ترسل كلمة مرور Render أو `DATABASE_URL` في المحادثة. يمكن تنفيذ الربط من لوحة Render أو عبر مستودع GitHub خاص.

### 13.2 إنشاء Web Service

من لوحة Render اختر `New` ثم `Web Service`، واختر مستودع المشروع والفرع المطلوب. استخدم الإعدادات التالية:

| الإعداد | القيمة |
|---|---|
| Language | Node |
| Build Command | `corepack enable && pnpm install --frozen-lockfile && pnpm build` |
| Start Command | `pnpm start` |
| Health Check Path | `/api/health` |
| Root Directory | اتركه فارغاً إذا كان المشروع في جذر المستودع |
| Region | اختر المنطقة الأقرب لقاعدة TiDB والمستخدمين |

بعد أول نشر يجب فتح عنوان Render الناتج واختبار `/api/health`. النتيجة الصحيحة هي JSON يتضمن `ok: true`، وليس صفحة HTML.

### 13.3 متغيرات البيئة على Render

أضف القيم من صفحة `Environment` في خدمة Render، ثم اختر `Save, rebuild, and deploy`. يجب إدخال `DATABASE_URL` أو `DRIZZLE_DATABASE_URL` بقيمة اتصال TiDB الصحيحة، إضافة إلى أسرار المصادقة والتطبيق المطلوبة في قسم متغيرات البيئة أعلاه. يجب أن تكون قيمة `PORT` متروكة لإدارة Render ما لم يطلب المشروع خلاف ذلك.

| المتغير | طريقة التعامل |
|---|---|
| `DATABASE_URL` أو `DRIZZLE_DATABASE_URL` | Secret؛ قيمة اتصال TiDB الكاملة |
| `JWT_SECRET` أو `COOKIE_SECRET` | Secret عشوائي قوي |
| `LAB_ADMIN_SETUP_CODE` | Secret؛ يستخدم عند الإعداد الأول فقط |
| `LAB_ADMIN_EMERGENCY_CODE` | Secret للطوارئ، مع تدويره دورياً |
| متغيرات Forge/OAuth المطلوبة | Secret أو قيمة البيئة المناسبة كما يحددها المشروع |
| `NODE_ENV` | `production` |

لا ترفع ملف `.env` إلى GitHub. تحفظ Render متغيرات البيئة خارج الكود، وتعيد نشر الخدمة عند اختيار خيار الحفظ والنشر. راجع [Render: Deploy a Node Express App](https://render.com/docs/deploy-node-express-app) و[Render: Environment Variables and Secrets](https://render.com/docs/configure-environment-variables).

### 13.4 الخطة المجانية أم المدفوعة

الخطة المجانية مناسبة للاختبار فقط؛ Render يوقف Web Service المجاني بعد 15 دقيقة من عدم استقبال طلبات، وقد يحتاج تشغيله مجدداً نحو دقيقة. كما أن نظام الملفات مؤقت، وساعات التشغيل المجانية محدودة، ولا ينبغي استخدام الخدمة المجانية كبيئة إنتاج لحسابات مختبر حقيقية. للاستخدام المستمر يوصى بخطة Web Service مدفوعة صغيرة، مع إبقاء قاعدة البيانات الحالية على TiDB وأخذ نسخ احتياطية مستقلة. التفاصيل الرسمية موجودة في [Render Free](https://render.com/docs/free).

### 13.5 بعد الحصول على عنوان Render

بعد أن يصبح العنوان مثلاً `https://dental-lab-api.onrender.com`، اختبر:

```bash
curl -i https://dental-lab-api.onrender.com/api/health
```

ثم حدّث متغير EAS production وأعد بناء APK:

```bash
eas env:set EXPO_PUBLIC_API_BASE_URL --environment production --scope project
# أدخل https://dental-lab-api.onrender.com عند طلب القيمة
eas build --platform android --profile production
```

قبل توزيع APK الجديد، اختبر تسجيل الدخول للمعمل، تسجيل الخروج، تسجيل الدخول للأدمن، ثم إعادة الدخول للمعمل. يجب أن يستمر عنوان Render نفسه حتى بعد إعادة تشغيل الخدمة، بخلاف Preview Proxy.

### المراجع الرسمية لهذا الفصل

[1] [Render — Deploy a Node Express App](https://render.com/docs/deploy-node-express-app)

[2] [Render — Environment Variables and Secrets](https://render.com/docs/configure-environment-variables)

[3] [Render — Deploy for Free](https://render.com/docs/free)

## تحديث أرشيف المصدر — 31 أغسطس 2026

تم إنشاء أرشيفي المصدر `dental-lab-accounting-source-latest.zip` و`dental-lab-accounting-source-latest.tar.gz` من آخر نسخة، مع استبعاد `node_modules` و`.git` و`.project-config.json` وملفات البيئة والأسرار وملفات البناء المؤقتة. تم اختبار سلامة الأرشيفين قبل التسليم.
