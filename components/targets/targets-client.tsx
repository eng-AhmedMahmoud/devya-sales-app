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
    <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-4">
      <form onSubmit={submit} className="surface-strong p-4 space-y-3">
        <div className="text-sm font-medium text-white">إضافة / تعديل هدف</div>
        <label className="block text-xs text-ink-300">
          المندوب
          <select value={repId} onChange={(e) => setRepId(e.target.value)} className="block w-full mt-1 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-ink-100">
            <option value="">— اختر —</option>
            {team.map((m) => (
              <option key={m.id} value={m.id}>{m.name ?? m.email}</option>
            ))}
          </select>
        </label>
        <label className="block text-xs text-ink-300">
          الشهر (YYYY-MM)
          <input dir="ltr" value={month} onChange={(e) => setMonth(e.target.value)} placeholder="2026-07"
            className="block w-full mt-1 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-ink-100 ltr-inline" />
        </label>
        <label className="block text-xs text-ink-300">
          هدف الإيراد (ريال)
          <input dir="ltr" type="number" min={0} value={revenue} onChange={(e) => setRevenue(e.target.value)}
            className="block w-full mt-1 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-ink-100 ltr-inline" />
        </label>
        <label className="block text-xs text-ink-300">
          عدد الصفقات (اختياري)
          <input dir="ltr" type="number" min={0} value={count} onChange={(e) => setCount(e.target.value)}
            className="block w-full mt-1 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-ink-100 ltr-inline" />
        </label>
        <button type="submit" disabled={pending}
          className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-white text-ink-900 px-3 py-2 text-sm font-medium hover:bg-ink-100 disabled:opacity-60">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          حفظ
        </button>
      </form>

      <div className="surface-strong overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wider text-ink-400 border-b border-white/5">
            <tr>
              <th className="text-start px-4 py-3">المندوب</th>
              <th className="text-start px-4 py-3">الشهر</th>
              <th className="text-start px-4 py-3">الإيراد المستهدف</th>
              <th className="text-start px-4 py-3">عدد الصفقات</th>
            </tr>
          </thead>
          <tbody>
            {list.map((t) => (
              <tr key={t.id} className="border-b border-white/[0.04]">
                <td className="px-4 py-3 text-white">{t.rep?.name ?? t.rep?.email ?? t.repId}</td>
                <td className="px-4 py-3 text-ink-300 ltr-inline">{t.month.slice(0, 7)}</td>
                <td className="px-4 py-3 text-emerald-300 ltr-inline">{t.revenueTargetSar.toLocaleString('en-US')}</td>
                <td className="px-4 py-3 text-ink-300 ltr-inline">{t.leadCountTarget ?? '—'}</td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan={4} className="text-center text-ink-500 py-8">لا توجد أهداف</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
