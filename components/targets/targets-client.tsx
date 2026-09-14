'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import type { SalesTarget, TeamMember } from '@/lib/types';
import { useDialog } from '@/components/ui/dialog-provider';

export function TargetsClient({ targets, team }: { targets: SalesTarget[]; team: TeamMember[] }) {
  const [list, setList] = useState(targets);
  const [repId, setRepId] = useState('');
  const [month, setMonth] = useState('');
  const [revenue, setRevenue] = useState('');
  const [count, setCount] = useState('');
  const [pending, start] = useTransition();
  const router = useRouter();
  const dialog = useDialog();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!repId || !month || !revenue) {
      dialog.notify({ title: 'اكمل جميع الحقول', tone: 'warn' });
      return;
    }
    start(async () => {
      try {
        const created = await api.targets.upsert({
          repId,
          month,
          revenueTargetSar: Number(revenue),
          leadCountTarget: count ? Number(count) : undefined,
        });
        setList((ls) => [created, ...ls.filter((t) => !(t.repId === created.repId && t.month === created.month))]);
        setRevenue('');
        setCount('');
        router.refresh();
      } catch (err) {
        dialog.notify({
          title: 'فشل الحفظ',
          message: err instanceof ApiError ? err.message : (err as Error).message,
          tone: 'danger',
        });
      }
    });
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[440px_1fr] gap-5">
      <form onSubmit={submit} className="surface-strong h-fit p-5 md:p-6 space-y-4">
        <div className="text-base font-semibold text-white">إضافة / تعديل هدف</div>
        <label className="block">
          <span className="form-label">المندوب</span>
          <select value={repId} onChange={(e) => setRepId(e.target.value)}>
            <option value="">— اختر —</option>
            {team.map((m) => (
              <option key={m.id} value={m.id}>{m.name ?? m.email}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="form-label">الشهر (YYYY-MM)</span>
          <input dir="ltr" value={month} onChange={(e) => setMonth(e.target.value)} placeholder="2026-07" />
        </label>
        <label className="block">
          <span className="form-label">هدف الإيراد (ريال)</span>
          <input dir="ltr" type="number" min={0} inputMode="numeric" value={revenue}
            onChange={(e) => setRevenue(e.target.value)} />
        </label>
        <label className="block">
          <span className="form-label">عدد الصفقات (اختياري)</span>
          <input dir="ltr" type="number" min={0} inputMode="numeric" value={count}
            onChange={(e) => setCount(e.target.value)} />
        </label>
        <button type="submit" disabled={pending}
          className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-white text-ink-900 px-4 text-base font-semibold hover:bg-ink-200 disabled:opacity-60 ring-focus">
          {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
          حفظ
        </button>
      </form>

      <div className="surface-strong h-fit overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="text-xs uppercase tracking-wider text-ink-300 border-b border-white/10">
            <tr>
              <th className="text-start px-4 py-3">المندوب</th>
              <th className="text-start px-4 py-3">الشهر</th>
              <th className="text-start px-4 py-3">الإيراد المستهدف</th>
              <th className="text-start px-4 py-3">عدد الصفقات</th>
            </tr>
          </thead>
          <tbody>
            {list.map((t) => (
              <tr key={t.id} className="border-b border-white/10">
                <td className="px-4 py-3 text-white">{t.rep?.name ?? t.rep?.email ?? t.repId}</td>
                <td className="px-4 py-3 text-ink-200"><span className="ltr-inline">{t.month.slice(0, 7)}</span></td>
                <td className="px-4 py-3 text-emerald-300"><span className="ltr-inline">{t.revenueTargetSar.toLocaleString('en-US')}</span></td>
                <td className="px-4 py-3 text-ink-200"><span className="ltr-inline">{t.leadCountTarget ?? '—'}</span></td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan={4} className="text-center text-ink-300 py-8">لا توجد أهداف</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
