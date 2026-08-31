import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import JSZip from "jszip";
import { Platform } from "react-native";

import { amountInArabicWords } from "./lab-format";

type LabProfile = { labName: string; phoneNumber: string; location: string; headerNote1?: string; headerNote2?: string; headerNote3?: string; logoUrl?: string | null };
type DoctorLedger = { client: { doctorName: string; clinicName: string }; currencyCode?: string; items: Array<{ invoiceNumber: string; orderDate: string; patientName?: string | null; orderType: string; category: string; serviceName: string; upperRight?: string; upperLeft?: string; lowerRight?: string; lowerLeft?: string; teethCount: number; unitPrice: string; totalAmount: string | null; currencyCode?: string; notes?: string | null }>; payments: Array<{ receiptNumber: number; paymentDate: string; amountPaid: string; discount: string; paymentMethod: string; currencyCode?: string; notes?: string | null }>; totals: { totalAmount: string; totalPayments: string; remainingAmount: string } };
type TechnicianLedger = { technician: { techName: string; specialty: string }; manualWork: Array<{ workDate: string; piecesCount: number; unitRate: string; totalAmount: string | null; notes?: string | null }>; payouts: Array<{ payoutDate: string; amountPaid: string; notes?: string | null }>; totals: { workTotal: string; paidTotal: string; remainingAmount: string } };
type SupplierLedger = { supplier: { supplierName: string; phoneNumber?: string | null; address?: string | null }; materials: Array<{ materialDate: string; materialDescription: string; amount: string; notes?: string | null }>; payments: Array<{ paymentDate: string; amountPaid: string; notes?: string | null }>; totals: { materialsTotal: string; paidTotal: string; remainingAmount: string } };

const esc = (value: unknown) => String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char] ?? char);
const numeric = (value: string | number | null | undefined) => Number(value ?? 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const typeLabel = (type: string) => type === "urgent" ? "مستعجل" : type === "adjustment" ? "تعديل" : "عادي";
const paymentLabel = (method: string) => method === "bank" ? "بنك" : method === "pos" ? "شبكة" : "نقدًا";
const periodLabel = (startDate: string, endDate: string) => {
  const [year, month] = startDate.split("-");
  return startDate.slice(0, 7) === endDate.slice(0, 7) ? `شهر ${Number(month)} سنة ${year}` : `من ${startDate} إلى ${endDate}`;
};
const normalizeFileName = (value: string, extension: "pdf" | "zip") => {
  const withoutExtension = value.trim().replace(new RegExp(`\\.${extension}\\b`, "ig"), "");
  const safeName = withoutExtension.replace(/[\\/:*?"<>|\u0000-\u001F]/g, " ").replace(/\s+/g, " ").trim() || "مستند";
  return `${safeName}.${extension}`;
};
export const pdfFileName = (value: string) => normalizeFileName(value, "pdf");
export const zipFileName = (value: string) => normalizeFileName(value, "zip");
const absoluteUrl = (url?: string | null) => {
  if (!url || /^https?:\/\//.test(url)) return url ?? "";
  const base = (process.env.EXPO_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");
  return base ? `${base}${url}` : url;
};

function shell(profile: LabProfile, title: string, subtitle: string, body: string) {
  const notes = [profile.headerNote1, profile.headerNote2, profile.headerNote3]
    .filter(Boolean)
    .map((value) => `<div>${esc(value)}</div>`)
    .join("");
  const logo = absoluteUrl(profile.logoUrl);

  return `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8"/><style>
    @page{size:A4;margin:10mm 8mm 14mm;@bottom-center{content:"صفحة " counter(page) " من " counter(pages);font-family:Arial,Tahoma,sans-serif;font-size:9px;color:#000}}
    *{box-sizing:border-box}
    body{font-family:Arial,Tahoma,sans-serif;color:#000;font-size:9.3px;line-height:1.18;font-weight:600}
    .header{display:grid;grid-template-columns:1fr 124px 1fr;gap:10px;align-items:center;border-bottom:3px solid #4c8b50;padding:5px 4px 7px;margin-bottom:6px;min-height:88px}
    .lab-info,.notes{min-height:72px;display:flex;flex-direction:column;justify-content:center;gap:3px;font-family:Tahoma,Arial,sans-serif;font-size:15px;line-height:1.35;font-weight:700}
    .lab-info{align-items:flex-start;text-align:right}.notes{align-items:flex-end;text-align:left}
    .lab-name{font-size:20px;font-weight:800}.logo-wrap{text-align:center}.logo{width:112px;height:80px;object-fit:contain}
    .report-bar{display:flex;justify-content:space-between;gap:6px;align-items:center;border:1px solid #000;background:#f0f6ea;padding:4px 6px;margin:5px 0}.report-title{font-size:14px;font-weight:800;text-align:center;flex:1}.section{font-size:11px;font-weight:800;margin:7px 0 3px}
    table{width:100%;border-collapse:collapse;page-break-inside:auto}thead{display:table-header-group}tr{page-break-inside:avoid}th,td{border:1px solid #000;padding:1px 3px;text-align:center;vertical-align:middle;color:#000;font-weight:600}th{background:#dce8c9;font-weight:800;font-size:8.2px;padding:3px}
    .urgent{color:#d10000;font-weight:800}
    td.tooth-cell{padding:0!important;width:16%}.tooth-grid{display:grid;grid-template-columns:1fr 1fr;direction:ltr;width:100%;height:30px;overflow:hidden}.tooth-grid div{min-height:15px;padding:0 4px;font-size:8.7px;line-height:1;display:flex;align-items:center}.tooth-grid .upper-right,.tooth-grid .lower-right{justify-content:flex-end;text-align:right;border-right:1px solid #000}.tooth-grid .upper-left,.tooth-grid .lower-left{justify-content:flex-start;text-align:left}.tooth-grid .lower-right,.tooth-grid .lower-left{border-top:1px solid #000}
    .summary{margin-top:8px;margin-right:auto;margin-left:0;width:50%;min-width:245px}.summary-row{display:grid;grid-template-columns:1fr 1.25fr;border:1px solid #000;border-bottom:0}.summary-row:last-of-type{border-bottom:1px solid #000}.summary-label{background:#ecefe3;padding:5px;font-weight:800}.summary-value{padding:5px;color:#d10000;font-size:11px;font-weight:800;text-align:center}.words{border:1px solid #000;padding:6px;text-align:center;font-size:10px;font-weight:700}.footer{margin-top:10px;padding-top:5px;border-top:1px solid #000;text-align:center;font-size:8px;color:#000}
  </style></head><body><div class="header"><div class="lab-info"><div class="lab-name">${esc(profile.labName || "بيانات المختبر غير مكتملة")}</div><div>${esc(profile.phoneNumber ? `الهاتف: ${profile.phoneNumber}` : "")}</div><div>${esc(profile.location || "")}</div></div><div class="logo-wrap">${logo ? `<img class="logo" src="${esc(logo)}"/>` : ""}</div><div class="notes">${notes}</div></div><div class="report-bar"><span>تاريخ التقرير: ${esc(new Date().toISOString().slice(0, 10))}</span><span class="report-title">${esc(title)}</span><span>${esc(subtitle)}</span></div>${body}<p class="footer">تم إنشاء هذا التقرير من نظام حسابات مختبر الأسنان — بواسطة المهندس بدر المليكي</p></body></html>`;
}

function toothGrid(item: DoctorLedger["items"][number]) {
  return `<div class="tooth-grid"><div class="upper-right">${esc(item.upperRight || "")}</div><div class="upper-left">${esc(item.upperLeft || "")}</div><div class="lower-right">${esc(item.lowerRight || "")}</div><div class="lower-left">${esc(item.lowerLeft || "")}</div></div>`;
}

export function doctorLedgerHtml(profile: LabProfile, ledger: DoctorLedger, startDate: string, endDate: string) {
  const orders = ledger.items.map((item) => `<tr><td>${esc(item.invoiceNumber)}</td><td>${esc(item.orderDate)}</td><td>${esc(item.notes || item.patientName || "—")}</td><td class="${item.orderType === "urgent" ? "urgent" : ""}">${esc(typeLabel(item.orderType))}</td><td>${esc(item.category)}</td><td>${esc(item.serviceName)}</td><td class="tooth-cell">${toothGrid(item)}</td><td>${esc(item.teethCount)}</td><td>${esc(numeric(item.unitPrice))} ${esc(item.currencyCode ?? ledger.currencyCode ?? "")}</td><td>${esc(numeric(item.totalAmount))} ${esc(item.currencyCode ?? ledger.currencyCode ?? "")}</td></tr>`).join("") || `<tr><td colspan="10">لا توجد حالات ضمن الفترة المحددة.</td></tr>`;
  const payments = ledger.payments.map((item) => `<tr><td>${esc(item.receiptNumber)}</td><td>${esc(item.paymentDate)}</td><td>${esc(paymentLabel(item.paymentMethod))}</td><td>${esc(numeric(item.amountPaid))}</td><td>${esc(numeric(item.discount))}</td><td>${esc(item.notes || "—")}</td></tr>`).join("") || `<tr><td colspan="6">لا توجد دفعات ضمن الفترة المحددة.</td></tr>`;
  const body = `<p class="section">تفاصيل الحالات</p><table><thead><tr><th>رقم الحالة</th><th>التاريخ</th><th>ملاحظات</th><th>نوع العمل</th><th>الفئة</th><th>اسم الخدمة</th><th>موقع الأسنان</th><th>الكمية</th><th>سعر الوحدة</th><th>الإجمالي</th></tr></thead><tbody>${orders}</tbody></table><p class="section">المدفوعات والخصومات</p><table><thead><tr><th>السند</th><th>التاريخ</th><th>الوسيلة</th><th>المدفوع</th><th>الخصم</th><th>ملاحظات</th></tr></thead><tbody>${payments}</tbody></table><div class="summary"><div class="summary-row"><div class="summary-label">الإجمالي الكلي</div><div class="summary-value">${esc(numeric(ledger.totals.totalAmount))}</div></div><div class="summary-row"><div class="summary-label">إجمالي المدفوعات</div><div class="summary-value">${esc(numeric(ledger.totals.totalPayments))}</div></div><div class="summary-row"><div class="summary-label">المبلغ المتبقي</div><div class="summary-value">${esc(numeric(ledger.totals.remainingAmount))}</div></div><div class="words">${esc(amountInArabicWords(Number(ledger.totals.remainingAmount)))}</div></div>`;
  return shell(profile, `كشف حساب الدكتور ${ledger.client.doctorName} — ${periodLabel(startDate, endDate)}`, `العيادة: ${ledger.client.clinicName}${ledger.currencyCode && ledger.currencyCode !== "ALL" ? ` · العملة: ${ledger.currencyCode}` : ""}`, body);
}

export function periodSummaryHtml(profile: LabProfile, report: { startDate: string; endDate: string; currencyCode?: string; totals: { casesCount: number; piecesCount: number; revenue: string }; breakdown: Array<{ category: string; orderType: string; casesCount: number; piecesCount: number; revenue: string }> }) {
  const rows = report.breakdown.map((item) => `<tr><td>${esc(item.category)}</td><td class="${item.orderType === "urgent" ? "urgent" : ""}">${esc(typeLabel(item.orderType))}</td><td>${esc(item.casesCount)}</td><td>${esc(item.piecesCount)}</td><td>${esc(numeric(item.revenue))}</td></tr>`).join("") || `<tr><td colspan="5">لا توجد حالات ضمن الفترة المحددة.</td></tr>`;
  const body = `<div class="summary"><div class="summary-row"><div class="summary-label">عدد الحالات</div><div class="summary-value">${esc(report.totals.casesCount)}</div></div><div class="summary-row"><div class="summary-label">إجمالي القطع</div><div class="summary-value">${esc(report.totals.piecesCount)}</div></div><div class="summary-row"><div class="summary-label">إجمالي الإيرادات</div><div class="summary-value">${esc(numeric(report.totals.revenue))}</div></div><div class="words">${esc(amountInArabicWords(Number(report.totals.revenue)))}</div></div><p class="section">تفصيل القطع والإيرادات حسب الفئة ونوع الطلب</p><table><thead><tr><th>الفئة</th><th>نوع الطلب</th><th>عدد الحالات</th><th>عدد القطع</th><th>الإيرادات</th></tr></thead><tbody>${rows}</tbody></table>`;
  return shell(profile, `تقرير الحالات والإيرادات — ${periodLabel(report.startDate, report.endDate)}`, report.currencyCode && report.currencyCode !== "ALL" ? `العملة: ${report.currencyCode}` : "كل العملات (محسوبة حسب الإعدادات)", body);
}

export function profitLossHtml(profile: LabProfile, report: { startDate: string; endDate: string; piecesCount: number; revenue: string; totalCosts: string; netResult: string; costs: Record<string, string> }) {
  const labels: Record<string, string> = { materials: "تكلفة المواد", wages: "تكلفة الرواتب", rent: "تكلفة الإيجارات", installments: "تكلفة الأقساط", utilities: "الكهرباء والماء والمرافق", other: "النثريات الأخرى" };
  const costRows = Object.entries(report.costs).map(([key, value]) => `<tr><td>${esc(labels[key] ?? key)}</td><td>${esc(numeric(value))}</td></tr>`).join("");
  const body = `<div class="summary"><div class="summary-row"><div class="summary-label">إجمالي القطع</div><div class="summary-value">${esc(report.piecesCount)}</div></div><div class="summary-row"><div class="summary-label">إجمالي الإيرادات</div><div class="summary-value">${esc(numeric(report.revenue))}</div></div><div class="summary-row"><div class="summary-label">إجمالي التكاليف</div><div class="summary-value">${esc(numeric(report.totalCosts))}</div></div><div class="summary-row"><div class="summary-label">صافي الربح / الخسارة</div><div class="summary-value">${esc(numeric(report.netResult))}</div></div><div class="words">${esc(amountInArabicWords(Number(report.netResult)))}</div></div><p class="section">تفصيل حساب التكاليف</p><table><thead><tr><th>نوع التكلفة</th><th>المبلغ</th></tr></thead><tbody>${costRows}</tbody></table>`;
  return shell(profile, `تقرير الأرباح والخسائر — ${periodLabel(report.startDate, report.endDate)}`, "", body);
}

export function technicianLedgerHtml(profile: LabProfile, ledger: TechnicianLedger, startDate: string, endDate: string) {
  const work = ledger.manualWork.map((item) => `<tr><td>${esc(item.workDate)}</td><td>${esc(item.piecesCount)}</td><td>${esc(numeric(item.unitRate))}</td><td>${esc(numeric(item.totalAmount))}</td><td>${esc(item.notes || "—")}</td></tr>`).join("") || `<tr><td colspan="5">لا توجد إدخالات إنجاز ضمن الفترة المحددة.</td></tr>`;
  const payouts = ledger.payouts.map((item) => `<tr><td>${esc(item.payoutDate)}</td><td>${esc(numeric(item.amountPaid))}</td><td>${esc(item.notes || "—")}</td></tr>`).join("") || `<tr><td colspan="3">لا توجد سحوبات ضمن الفترة المحددة.</td></tr>`;
  const body = `<p class="section">إنجازات الفني</p><table><thead><tr><th>التاريخ</th><th>عدد القطع</th><th>سعر القطعة</th><th>الإجمالي</th><th>ملاحظات</th></tr></thead><tbody>${work}</tbody></table><p class="section">المبالغ المسحوبة</p><table><thead><tr><th>التاريخ</th><th>المبلغ</th><th>ملاحظات</th></tr></thead><tbody>${payouts}</tbody></table><div class="summary"><div class="summary-row"><div class="summary-label">إجمالي الإنجاز</div><div class="summary-value">${esc(numeric(ledger.totals.workTotal))}</div></div><div class="summary-row"><div class="summary-label">إجمالي المسحوب</div><div class="summary-value">${esc(numeric(ledger.totals.paidTotal))}</div></div><div class="summary-row"><div class="summary-label">المستحق النهائي</div><div class="summary-value">${esc(numeric(ledger.totals.remainingAmount))}</div></div><div class="words">${esc(amountInArabicWords(Number(ledger.totals.remainingAmount)))}</div></div>`;
  return shell(profile, `كشف حساب الفني ${ledger.technician.techName} — ${periodLabel(startDate, endDate)}`, `التخصص: ${ledger.technician.specialty}`, body);
}

export function supplierLedgerHtml(profile: LabProfile, ledger: SupplierLedger, startDate: string, endDate: string) {
  const materials = ledger.materials.map((item) => `<tr><td>${esc(item.materialDate)}</td><td>${esc(item.materialDescription)}</td><td>${esc(numeric(item.amount))}</td><td>${esc(item.notes || "—")}</td></tr>`).join("") || `<tr><td colspan="4">لا توجد مواد مسجلة ضمن الفترة المحددة.</td></tr>`;
  const payments = ledger.payments.map((item) => `<tr><td>${esc(item.paymentDate)}</td><td>${esc(numeric(item.amountPaid))}</td><td>${esc(item.notes || "—")}</td></tr>`).join("") || `<tr><td colspan="3">لا توجد سندات صرف ضمن الفترة المحددة.</td></tr>`;
  const body = `<p class="section">المواد المستلمة</p><table><thead><tr><th>التاريخ</th><th>وصف المواد</th><th>القيمة</th><th>ملاحظات</th></tr></thead><tbody>${materials}</tbody></table><p class="section">سندات الصرف</p><table><thead><tr><th>التاريخ</th><th>المبلغ المصروف</th><th>ملاحظات</th></tr></thead><tbody>${payments}</tbody></table><div class="summary"><div class="summary-row"><div class="summary-label">إجمالي المواد</div><div class="summary-value">${esc(numeric(ledger.totals.materialsTotal))}</div></div><div class="summary-row"><div class="summary-label">إجمالي المدفوعات</div><div class="summary-value">${esc(numeric(ledger.totals.paidTotal))}</div></div><div class="summary-row"><div class="summary-label">المبلغ المتبقي</div><div class="summary-value">${esc(numeric(ledger.totals.remainingAmount))}</div></div><div class="words">${esc(amountInArabicWords(Number(ledger.totals.remainingAmount)))}</div></div>`;
  return shell(profile, `كشف حساب المورد ${ledger.supplier.supplierName} — ${periodLabel(startDate, endDate)}`, ledger.supplier.phoneNumber || "", body);
}

export async function sharePdf(html: string, fileName: string): Promise<void> {
  if (Platform.OS === "web") throw new Error("تصدير PDF متاح داخل تطبيق أندرويد أو iOS.");
  const { uri } = await Print.printToFileAsync({ html, width: 595, height: 842, margins: { left: 14, right: 14, top: 14, bottom: 14 } });
  const name = pdfFileName(fileName);
  const namedUri = `${FileSystem.cacheDirectory}${name}`;
  const previousFile = await FileSystem.getInfoAsync(namedUri);
  if (previousFile.exists) await FileSystem.deleteAsync(namedUri, { idempotent: true });
  await FileSystem.copyAsync({ from: uri, to: namedUri });
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(namedUri, { mimeType: "application/pdf", UTI: ".pdf", dialogTitle: name });
}

export async function shareDoctorLedgerBatch(entries: Array<{ fileName: string; html: string }>, archiveFileName = "كشوفات حساب الأطباء") {
  if (Platform.OS === "web") throw new Error("التصدير الجماعي متاح داخل تطبيق أندرويد أو iOS.");
  const zip = new JSZip();
  for (const entry of entries) {
    const pdf = await Print.printToFileAsync({ html: entry.html, base64: true, width: 595, height: 842, margins: { left: 14, right: 14, top: 14, bottom: 14 } });
    if (!pdf.base64) throw new Error("تعذر تجهيز ملف PDF للتصدير الجماعي.");
    zip.file(pdfFileName(entry.fileName), pdf.base64, { base64: true });
  }
  const zipBase64 = await zip.generateAsync({ type: "base64" });
  const archiveName = zipFileName(archiveFileName);
  const uri = `${FileSystem.cacheDirectory}${archiveName}`;
  const previousFile = await FileSystem.getInfoAsync(uri);
  if (previousFile.exists) await FileSystem.deleteAsync(uri, { idempotent: true });
  await FileSystem.writeAsStringAsync(uri, zipBase64, { encoding: FileSystem.EncodingType.Base64 });
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: "application/zip", dialogTitle: archiveName });
  return uri;
}

export function doctorLedgerFileName(name: string, startDate: string, endDate: string) {
  return pdfFileName(`كشف حساب - الدكتور ${name} - ${periodLabel(startDate, endDate)}`);
}

export function doctorLedgerBatchFileName(startDate: string, endDate: string) {
  return zipFileName(`كشوفات حساب الأطباء - ${periodLabel(startDate, endDate)}`);
}

type ReceiptLine = { label: string; value: string };
function receiptHtml(profile: LabProfile, title: string, reference: string, rows: ReceiptLine[], amount: string, currencyLabel: string, signatory: string) {
  const detailRows = rows.map((row) => `<tr><th>${esc(row.label)}</th><td>${esc(row.value)}</td></tr>`).join("");
  const body = `<div class="receipt"><p class="section">${esc(title)}</p><table><tbody>${detailRows}</tbody></table><div class="summary"><div class="summary-row"><div class="summary-label">المبلغ</div><div class="summary-value">${esc(numeric(amount))} ${esc(currencyLabel)}</div></div><div class="words">${esc(amountInArabicWords(Number(amount)))}</div></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:34px;font-size:10px"><div style="border-top:1px solid #000;text-align:center;padding-top:5px">توقيع المستلم</div><div style="border-top:1px solid #000;text-align:center;padding-top:5px">${esc(signatory)}</div></div></div>`;
  return shell(profile, title, reference, body);
}

export function orderInvoiceHtml(profile: LabProfile, order: { invoiceNumber: string; orderDate: string; doctorName: string; clinicName: string; patientName?: string | null; category: string; serviceName: string; orderType: string; upperRight?: string; upperLeft?: string; lowerRight?: string; lowerLeft?: string; teethCount: number; unitPrice: string; totalAmount: string | null; currencyCode: string; notes?: string | null }) {
  const body = `<p class="section">تفاصيل الحالة</p><table><thead><tr><th>رقم الحالة</th><th>التاريخ</th><th>الطبيب / العيادة</th><th>المريض أو الملاحظة</th><th>الخدمة</th><th>موقع الأسنان</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr></thead><tbody><tr><td>${esc(order.invoiceNumber)}</td><td>${esc(order.orderDate)}</td><td>${esc(`${order.doctorName} — ${order.clinicName}`)}</td><td>${esc(order.patientName || order.notes || "—")}</td><td>${esc(`${order.category} / ${order.serviceName} ${typeLabel(order.orderType)}`)}</td><td class="tooth-cell">${toothGrid(order)}</td><td>${esc(order.teethCount)}</td><td>${esc(numeric(order.unitPrice))}</td><td>${esc(numeric(order.totalAmount))}</td></tr></tbody></table><div class="summary"><div class="summary-row"><div class="summary-label">إجمالي الفاتورة</div><div class="summary-value">${esc(numeric(order.totalAmount))} ${esc(order.currencyCode)}</div></div><div class="words">${esc(amountInArabicWords(Number(order.totalAmount)))}</div></div>`;
  return shell(profile, `فاتورة الحالة رقم ${order.invoiceNumber}`, `العملة: ${order.currencyCode}`, body);
}

export function paymentReceiptHtml(profile: LabProfile, entry: { receiptNumber: number | string; paymentDate: string; doctorName: string; clinicName: string; amountPaid: string; discount?: string; paymentMethod: string; currencyCode: string; notes?: string | null; remainingBalance?: string }) {
  return receiptHtml(profile, `سند قبض رقم ${entry.receiptNumber}`, `التاريخ: ${entry.paymentDate}`, [{ label: "الطبيب / العيادة", value: `${entry.doctorName} — ${entry.clinicName}` }, { label: "وسيلة السداد", value: paymentLabel(entry.paymentMethod) }, { label: "الخصم", value: numeric(entry.discount ?? "0") }, { label: "الرصيد المتبقي", value: numeric(entry.remainingBalance ?? "0") }, { label: "ملاحظات", value: entry.notes || "—" }], entry.amountPaid, entry.currencyCode, "مسؤول المختبر");
}

export function technicianPayoutReceiptHtml(profile: LabProfile, entry: { reference: string | number; payoutDate: string; techName: string; amountPaid: string; payoutType: string; paymentMethod: string; currencyCode: string; notes?: string | null }) {
  const payoutTypeLabel = entry.payoutType === "advance" ? "سلفة" : entry.payoutType === "bonus" ? "مكافأة" : "دفعة";
  return receiptHtml(profile, `سند صرف فني رقم ${entry.reference}`, `التاريخ: ${entry.payoutDate}`, [{ label: "اسم الفني", value: entry.techName }, { label: "نوع الصرف", value: payoutTypeLabel }, { label: "وسيلة السداد", value: paymentLabel(entry.paymentMethod) }, { label: "ملاحظات", value: entry.notes || "—" }], entry.amountPaid, entry.currencyCode, "مسؤول المختبر");
}

export function expenseReceiptHtml(profile: LabProfile, entry: { reference: string | number; expenseDate: string; category: string; costType: string; amount: string; currencyCode: string; notes?: string | null }) {
  const costLabels: Record<string, string> = { materials: "مواد", wages: "رواتب", rent: "إيجارات", installments: "أقساط", utilities: "كهرباء وماء ومرافق", other: "نثريات أخرى" };
  return receiptHtml(profile, `سند مصروف رقم ${entry.reference}`, `التاريخ: ${entry.expenseDate}`, [{ label: "التصنيف", value: entry.category }, { label: "نوع المصروف", value: costLabels[entry.costType] ?? entry.costType }, { label: "ملاحظات", value: entry.notes || "—" }], entry.amount, entry.currencyCode, "مسؤول المختبر");
}

export function technicianWorkReceiptHtml(profile: LabProfile, entry: { reference: string | number; workDate: string; techName: string; piecesCount: number; unitRate: string; totalAmount: string; currencyCode?: string; notes?: string | null }) {
  return receiptHtml(profile, `إنجاز فني رقم ${entry.reference}`, `التاريخ: ${entry.workDate}`, [{ label: "اسم الفني", value: entry.techName }, { label: "عدد القطع", value: String(entry.piecesCount) }, { label: "سعر القطعة", value: numeric(entry.unitRate) }, { label: "ملاحظات", value: entry.notes || "—" }], entry.totalAmount, entry.currencyCode || "YER", "مسؤول المختبر");
}

export function supplierMaterialReceiptHtml(profile: LabProfile, entry: { reference: string | number; materialDate: string; supplierName: string; materialDescription: string; amount: string; currencyCode?: string; notes?: string | null }) {
  return receiptHtml(profile, `فاتورة مواد مورد رقم ${entry.reference}`, `التاريخ: ${entry.materialDate}`, [{ label: "اسم المورد", value: entry.supplierName }, { label: "وصف المواد", value: entry.materialDescription }, { label: "ملاحظات", value: entry.notes || "—" }], entry.amount, entry.currencyCode || "YER", "مسؤول المختبر");
}

export function supplierPaymentReceiptHtml(profile: LabProfile, entry: { reference: string | number; paymentDate: string; supplierName: string; amountPaid: string; currencyCode?: string; notes?: string | null }) {
  return receiptHtml(profile, `سند صرف مورد رقم ${entry.reference}`, `التاريخ: ${entry.paymentDate}`, [{ label: "اسم المورد", value: entry.supplierName }, { label: "ملاحظات", value: entry.notes || "—" }], entry.amountPaid, entry.currencyCode || "YER", "مسؤول المختبر");
}

export function archiveFileName(kind: string, reference: string | number, date: string) {
  const labels: Record<string, string> = { payment: "سند قبض", payout: "سند صرف فني", work: "إنجاز فني", expense: "سند مصروف", material: "فاتورة مواد مورد", supplierPayment: "سند صرف مورد" };
  return pdfFileName(`${labels[kind] || "حركة مالية"} - ${reference} - ${date}`);
}


export type CashboxStatement = {
  cashbox: { name: string; currencyCode: string };
  startDate: string;
  endDate: string;
  openingBalance: string;
  finalBalance: string;
  items: Array<{ date: string; kind: string; amount: string; signedAmount: string; currencyCode: string; notes?: string | null; party?: string | null }>;
};

export function cashboxStatementHtml(profile: LabProfile, report: CashboxStatement) {
  const rows = report.items.map((item) => `<tr><td>${esc(item.date)}</td><td>${esc(item.kind)}</td><td>${esc(item.party || "—")}</td><td>${esc(item.notes || "—")}</td><td class="${Number(item.signedAmount) < 0 ? "urgent" : ""}">${esc(item.signedAmount)} ${esc(item.currencyCode)}</td></tr>`).join("") || `<tr><td colspan="5">لا توجد حركة ضمن الفترة المحددة.</td></tr>`;
  const body = `<div class="summary"><div class="summary-row"><div class="summary-label">اسم الصندوق</div><div class="summary-value">${esc(report.cashbox.name)}</div></div><div class="summary-row"><div class="summary-label">العملة</div><div class="summary-value">${esc(report.cashbox.currencyCode)}</div></div><div class="summary-row"><div class="summary-label">الرصيد الافتتاحي</div><div class="summary-value">${esc(numeric(report.openingBalance))} ${esc(report.cashbox.currencyCode)}</div></div></div><p class="section">الحركة التفصيلية من ${esc(report.startDate)} إلى ${esc(report.endDate)}</p><table><thead><tr><th>التاريخ</th><th>نوع الحركة</th><th>الطرف الآخر</th><th>ملاحظات</th><th>المبلغ الصافي</th></tr></thead><tbody>${rows}</tbody></table><div class="summary"><div class="summary-row"><div class="summary-label">الرصيد النهائي للمدة</div><div class="summary-value">${esc(numeric(report.finalBalance))} ${esc(report.cashbox.currencyCode)}</div></div><div class="words">${esc(amountInArabicWords(Number(report.finalBalance)))}</div></div>`;
  return shell(profile, `تقرير حركة الصندوق — ${report.cashbox.name}`, `العملة: ${report.cashbox.currencyCode} · من ${report.startDate} إلى ${report.endDate}`, body);
}
