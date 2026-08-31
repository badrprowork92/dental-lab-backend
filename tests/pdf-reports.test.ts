import { describe, expect, it, vi } from "vitest";

vi.mock("react-native", () => ({ Platform: { OS: "android" } }));
vi.mock("expo-print", () => ({ printToFileAsync: vi.fn() }));
vi.mock("expo-sharing", () => ({ isAvailableAsync: vi.fn(), shareAsync: vi.fn() }));
vi.mock("expo-file-system/legacy", () => ({ cacheDirectory: "file:///cache/", getInfoAsync: vi.fn(), deleteAsync: vi.fn(), copyAsync: vi.fn(), writeAsStringAsync: vi.fn(), EncodingType: { Base64: "base64" } }));
vi.mock("jszip", () => ({ default: class JSZip {} }));

import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { archiveFileName, doctorLedgerBatchFileName, doctorLedgerFileName, doctorLedgerHtml, expenseReceiptHtml, orderInvoiceHtml, paymentReceiptHtml, pdfFileName, periodSummaryHtml, profitLossHtml, sharePdf, supplierLedgerHtml, supplierMaterialReceiptHtml, supplierPaymentReceiptHtml, technicianLedgerHtml, technicianPayoutReceiptHtml, technicianWorkReceiptHtml, zipFileName } from "../lib/pdf-reports";

const profile = { labName: "معمل الثقة", phoneNumber: "777000000", location: "صنعاء", headerNote1: "ملاحظة أولى", headerNote2: "ملاحظة ثانية", headerNote3: "ملاحظة ثالثة", logoUrl: "https://example.test/logo.png" };

describe("قوالب تقارير PDF", () => {
  it("ينشئ كشف حساب الطبيب بترويسة المختبر والطلبات والمدفوعات والتفقيط", () => {
    const html = doctorLedgerHtml(profile, {
      client: { doctorName: "محمد", clinicName: "عيادة النور" }, currencyCode: "SAR",
      items: [{ invoiceNumber: "12", orderDate: "2026-05-07", patientName: "أحمد", orderType: "urgent", category: "خزف", serviceName: "زركون", upperRight: "5432", upperLeft: "", lowerRight: "", lowerLeft: "", teethCount: 4, unitPrice: "15500", totalAmount: "62000", currencyCode: "SAR", notes: "لون A2" }],
      payments: [{ receiptNumber: 4, paymentDate: "2026-05-08", amountPaid: "20000", discount: "0", paymentMethod: "cash", notes: "دفعة" }],
      totals: { totalAmount: "62000", totalPayments: "20000", remainingAmount: "42000" },
    }, "2026-05-01", "2026-05-31");
    expect(html).toContain("معمل الثقة");
    expect(html).toContain("كشف حساب الدكتور محمد");
    expect(html).toContain("زركون");
    expect(html).toContain("المدفوعات والخصومات");
    expect(html).not.toContain("علوي يمين");
    expect(html).toContain("direction:ltr");
    expect(html).toContain('<div class="upper-right">5432</div><div class="upper-left"></div>');
    expect(html).toContain("counter(page)");
    expect(html).toContain("margin-right:auto;margin-left:0");
    expect(html).toContain("بواسطة المهندس بدر المليكي");
    expect(html).toContain("اثنان وأربعون ألف ريال يمني");
    expect(html).not.toContain("فقط لا غير ريال يمني لا غير");
    expect(html).toContain("grid-template-columns:1fr 124px 1fr");
    expect(html).toContain("font-size:15px");
    expect(html).toContain("width:112px;height:80px");
    expect(html).toContain("td.tooth-cell{padding:0!important");
    expect(html).toContain("justify-content:flex-end;text-align:right");
    expect(html).toContain("justify-content:flex-start;text-align:left");
    expect(html).toContain("العملة: SAR");
  });

  it("ينشئ ملخص الفترة وكشف الفني ويستخدم تسمية شهرية لملف الطبيب", () => {
    const summary = periodSummaryHtml(profile, { startDate: "2026-05-01", endDate: "2026-05-31", currencyCode: "USD", totals: { casesCount: 20, piecesCount: 80, revenue: "50000" }, breakdown: [{ category: "خزف", orderType: "urgent", casesCount: 5, piecesCount: 20, revenue: "20000" }] });
    const technician = technicianLedgerHtml(profile, { technician: { techName: "سالم", specialty: "خزف" }, manualWork: [{ workDate: "2026-05-10", piecesCount: 50, unitRate: "500", totalAmount: "25000", notes: "إنجاز أسبوعي" }], payouts: [{ payoutDate: "2026-05-15", amountPaid: "10000", notes: "سحب" }], totals: { workTotal: "25000", paidTotal: "10000", remainingAmount: "15000" } }, "2026-05-01", "2026-05-31");
    expect(summary).toContain("تفصيل القطع والإيرادات حسب الفئة ونوع الطلب");
    expect(summary).toContain("العملة: USD");
    expect(technician).toContain("كشف حساب الفني سالم");
    expect(doctorLedgerFileName("محمد", "2026-05-01", "2026-05-31")).toBe("كشف حساب - الدكتور محمد - شهر 5 سنة 2026.pdf");
    expect(doctorLedgerBatchFileName("2026-05-01", "2026-05-31")).toBe("كشوفات حساب الأطباء - شهر 5 سنة 2026.zip");
    expect(pdfFileName("كشف حساب الدكتور محمد.pdf ALL")).toBe("كشف حساب الدكتور محمد ALL.pdf");
    expect(pdfFileName("سند قبض: 2")).toBe("سند قبض 2.pdf");
    expect(zipFileName("كشوفات / الأطباء")).toBe("كشوفات الأطباء.zip");
  });

  it("ينشئ كشف حساب المورد بالمشتريات وسندات الصرف والمتبقي", () => {
    const html = supplierLedgerHtml(profile, { supplier: { supplierName: "شركة المواد", phoneNumber: "777111111" }, materials: [{ materialDate: "2026-05-02", materialDescription: "زركون", amount: "30000", notes: "دفعة أولى" }], payments: [{ paymentDate: "2026-05-20", amountPaid: "10000", notes: "سند 1" }], totals: { materialsTotal: "30000", paidTotal: "10000", remainingAmount: "20000" } }, "2026-05-01", "2026-05-31");
    expect(html).toContain("كشف حساب المورد شركة المواد");
    expect(html).toContain("زركون");
    expect(html).toContain("المبلغ المتبقي");
    expect(html).toContain("ملاحظة أولى");
  });

  it("ينشئ تقرير الأرباح والخسائر بتفاصيل التكاليف", () => {
    const html = profitLossHtml(profile, { startDate: "2026-05-01", endDate: "2026-05-31", piecesCount: 85, revenue: "150000", totalCosts: "60000", netResult: "90000", costs: { materials: "25000", wages: "20000", rent: "10000", installments: "0", utilities: "3000", other: "2000" } });
    expect(html).toContain("تقرير الأرباح والخسائر");
    expect(html).toContain("تكلفة المواد");
    expect(html).toContain("صافي الربح / الخسارة");
  });

  it("ينشئ فاتورة حالة وسندات منفردة بالعملة والتوقيع", () => {
    const invoice = orderInvoiceHtml(profile, { invoiceNumber: "44", orderDate: "2026-05-20", doctorName: "محمد", clinicName: "عيادة النور", patientName: "سارة", category: "خزف", serviceName: "زركون", orderType: "urgent", upperRight: "56", upperLeft: "", lowerRight: "", lowerLeft: "", teethCount: 2, unitPrice: "120", totalAmount: "240", currencyCode: "USD" });
    const payment = paymentReceiptHtml(profile, { receiptNumber: 7, paymentDate: "2026-05-20", doctorName: "محمد", clinicName: "عيادة النور", amountPaid: "100", discount: "0", paymentMethod: "cash", currencyCode: "SAR", remainingBalance: "140" });
    const payout = technicianPayoutReceiptHtml(profile, { reference: 3, payoutDate: "2026-05-20", techName: "سالم", amountPaid: "50", payoutType: "advance", paymentMethod: "bank", currencyCode: "YER" });
    const expense = expenseReceiptHtml(profile, { reference: 9, expenseDate: "2026-05-20", category: "كهرباء", costType: "utilities", amount: "25", currencyCode: "YER" });
    const work = technicianWorkReceiptHtml(profile, { reference: 10, workDate: "2026-05-20", techName: "سالم", piecesCount: 12, unitRate: "500", totalAmount: "6000", currencyCode: "YER" });
    const material = supplierMaterialReceiptHtml(profile, { reference: 11, materialDate: "2026-05-20", supplierName: "شركة المواد", materialDescription: "زركون", amount: "30000", currencyCode: "SAR" });
    const supplierPayment = supplierPaymentReceiptHtml(profile, { reference: 12, paymentDate: "2026-05-20", supplierName: "شركة المواد", amountPaid: "10000", currencyCode: "YER" });
    expect(invoice).toContain("فاتورة الحالة رقم 44");
    expect(invoice).toContain("العملة: USD");
    expect(payment).toContain("سند قبض رقم 7");
    expect(payout).toContain("نوع الصرف");
    expect(payout).toContain("سلفة");
    expect(expense).toContain("سند مصروف رقم 9");
    expect(expense).toContain("توقيع المستلم");
    expect(work).toContain("إنجاز فني رقم 10");
    expect(material).toContain("فاتورة مواد مورد رقم 11");
    expect(supplierPayment).toContain("سند صرف مورد رقم 12");
    expect(archiveFileName("payment", 7, "2026-05-20")).toBe("سند قبض - 7 - 2026-05-20.pdf");
  });

  it("ينسخ ملف PDF باسم وصفي وينهيه بالامتداد الصحيح قبل المشاركة", async () => {
    vi.mocked(Print.printToFileAsync).mockResolvedValue({ uri: "file:///cache/648be3bd-cda1.pdf" } as never);
    vi.mocked(FileSystem.getInfoAsync).mockResolvedValue({ exists: false } as never);
    vi.mocked(Sharing.isAvailableAsync).mockResolvedValue(true);
    await sharePdf("<html></html>", "كشف حساب - الدكتور محمد - شهر 8 سنة 2026");
    expect(FileSystem.copyAsync).toHaveBeenCalledWith({ from: "file:///cache/648be3bd-cda1.pdf", to: "file:///cache/كشف حساب - الدكتور محمد - شهر 8 سنة 2026.pdf" });
    expect(Sharing.shareAsync).toHaveBeenCalledWith("file:///cache/كشف حساب - الدكتور محمد - شهر 8 سنة 2026.pdf", expect.objectContaining({ dialogTitle: "كشف حساب - الدكتور محمد - شهر 8 سنة 2026.pdf" }));
  });
});
