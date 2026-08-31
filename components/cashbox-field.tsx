import { useMemo, useState } from "react";

import { AppText, SelectField, SelectionSheet } from "@/components/lab-ui";
import { trpc } from "@/lib/trpc";

type CashboxFieldProps = {
  value: number | null;
  onChange: (value: number | null) => void;
  currencyCode?: string;
  label?: string;
};

type Cashbox = {
  id: number;
  cashboxName: string;
  currencyCode: string;
  currentBalance: string | number;
  isActive: boolean;
};

export function CashboxField({ value, onChange, currencyCode, label = "الصندوق" }: CashboxFieldProps) {
  const [visible, setVisible] = useState(false);
  const cashboxesQuery = trpc.lab.cashboxes.list.useQuery(undefined, { retry: false });
  const cashboxes = (cashboxesQuery.data ?? []) as Cashbox[];
  const available = useMemo(
    () => cashboxes.filter((item) => item.isActive && (!currencyCode || item.currencyCode === currencyCode)),
    [cashboxes, currencyCode],
  );
  const selected = available.find((item) => item.id === value);

  return (
    <>
      <SelectField
        label={label}
        value={selected ? `${selected.cashboxName} (${selected.currencyCode})` : undefined}
        placeholder={cashboxesQuery.isLoading ? "جارٍ تحميل الصناديق…" : "اختر الصندوق"}
        onPress={() => setVisible(true)}
      />
      {!cashboxesQuery.isLoading && currencyCode && available.length === 0 ? (
        <AppText style={{ color: "#B45309", fontSize: 11 }}>لا يوجد صندوق مفعّل بعملة {currencyCode}.</AppText>
      ) : null}
      <SelectionSheet
        visible={visible}
        title={label}
        items={available.map((item) => ({
          id: item.id,
          label: `${item.cashboxName} (${item.currencyCode})`,
          subtitle: `الرصيد الحالي: ${item.currentBalance}`,
        }))}
        onClose={() => setVisible(false)}
        onSelect={(item) => {
          onChange(item.id);
          setVisible(false);
        }}
      />
    </>
  );
}
