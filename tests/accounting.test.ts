import { describe, expect, it } from "vitest";

import { calculateCashflow, calculateClientBalance, calculateCommission, calculateOrderTotal, calculateTechnicianBalance, calculateUnitPrice, countToothLocations } from "../lib/accounting";
import { amountInArabicWords } from "../lib/lab-format";

describe("قواعد المحاسبة لمختبر الأسنان", () => {
  it("يحسب إجمالي الحالة من عدد الأسنان وسعر الوحدة اليدوي", () => {
    expect(calculateOrderTotal(4, 12500)).toBe("50000.00");
  });

  it("يضيف ثلاثة آلاف تلقائيًا إلى سعر خدمة الحالة المستعجلة", () => {
    expect(calculateUnitPrice(12500, "normal")).toBe("12500.00");
    expect(calculateUnitPrice(12500, "urgent")).toBe("15500.00");
  });

  it("يعد مواقع الأسنان المدخلة في الخانات الأربعة تلقائيًا", () => {
    expect(countToothLocations("5432", "1234", "", "")).toBe(8);
    expect(countToothLocations("8765", "", "41", "42")).toBe(8);
  });

  it("يحسب رصيد الطبيب بعد الدفعات والخصومات", () => {
    expect(calculateClientBalance("50000.00", "18000.00", "2000.00")).toBe("30000.00");
  });

  it("يحتسب عمولة الفني الثابتة لكل سن", () => {
    expect(calculateCommission({ assignedTeeth: 3, unitPrice: 12000, commissionType: "fixed_per_tooth", commissionRate: 1500 })).toBe("4500.00");
  });

  it("يحتسب العمولة النسبية أو التسعيرة الخاصة بالخدمة", () => {
    expect(calculateCommission({ assignedTeeth: 2, unitPrice: 10000, commissionType: "percentage", commissionRate: 10 })).toBe("2000.00");
    expect(calculateCommission({ assignedTeeth: 2, unitPrice: 10000, commissionType: "percentage", commissionRate: 10, customRate: 1750 })).toBe("3500.00");
  });

  it("يطرح سندات الصرف من مستحق الفني", () => {
    expect(calculateTechnicianBalance(8400, 3000)).toBe("5400.00");
  });

  it("يحسب صافي التدفق النقدي بعد المقبوضات والمدفوعات والتحويلات", () => {
    expect(calculateCashflow(100000, 35000, 12000, 8000)).toBe("69000.00");
  });

  it("يحوّل الرصيد إلى تفقيط عربي مناسب للتقرير", () => {
    expect(amountInArabicWords(340000)).toContain("ثلاثمائة وأربعون ألف ريال يمني");
  });
});
