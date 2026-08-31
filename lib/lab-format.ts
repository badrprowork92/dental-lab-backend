export function formatMoney(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);
  return `${new Intl.NumberFormat("ar-YE", { maximumFractionDigits: 0 }).format(amount)} ر.ي`;
}

const ones = ["", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة"];
const teens = ["عشرة", "أحد عشر", "اثنا عشر", "ثلاثة عشر", "أربعة عشر", "خمسة عشر", "ستة عشر", "سبعة عشر", "ثمانية عشر", "تسعة عشر"];
const tens = ["", "", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
const hundreds = ["", "مائة", "مائتان", "ثلاثمائة", "أربعمائة", "خمسمائة", "ستمائة", "سبعمائة", "ثمانمائة", "تسعمائة"];

function underThousand(value: number): string {
  const parts: string[] = [];
  const h = Math.floor(value / 100);
  const rest = value % 100;
  if (h) parts.push(hundreds[h]);
  if (rest >= 10 && rest < 20) parts.push(teens[rest - 10]);
  else {
    const t = Math.floor(rest / 10);
    const o = rest % 10;
    if (o && t) parts.push(`${ones[o]} و${tens[t]}`);
    else if (t) parts.push(tens[t]);
    else if (o) parts.push(ones[o]);
  }
  return parts.join(" و");
}

export function amountInArabicWords(input: number | string) {
  const amount = Math.round(Math.abs(Number(input) || 0));
  if (!amount) return "صفر ريال يمني فقط لا غير";
  const millions = Math.floor(amount / 1_000_000);
  const thousands = Math.floor((amount % 1_000_000) / 1_000);
  const rest = amount % 1_000;
  const parts: string[] = [];
  if (millions) parts.push(`${underThousand(millions)} مليون`);
  if (thousands) parts.push(`${underThousand(thousands)} ألف`);
  if (rest) parts.push(underThousand(rest));
  return `${Number(input) < 0 ? "رصيد دائن بمبلغ " : ""}${parts.join(" و")} ريال يمني فقط لا غير`;
}

export const orderLabels = { normal: "عادي", urgent: "مستعجل", adjustment: "تعديل" } as const;
export const orderStatusLabels = { new: "جديد", in_progress: "قيد التصنيع", completed: "مكتمل", delivered: "مسلّم" } as const;
export const paymentMethodLabels = { cash: "نقدي", bank: "تحويل بنكي", pos: "شبكة" } as const;
