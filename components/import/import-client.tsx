'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Upload } from 'lucide-react';
import { api, ApiError, BUDGET_LABELS_AR, SOURCE_LABELS_AR, STAGE_LABELS_AR } from '@/lib/api';
import type { TeamMember } from '@/lib/types';
import { useDialog } from '@/components/ui/dialog-provider';

interface ImportRow {
  index: number;
  clientName: string;
  companyName: string | null;
  phone: string | null;
  email: string | null;
  source: keyof typeof SOURCE_LABELS_AR;
  budget: keyof typeof BUDGET_LABELS_AR;
  stage: keyof typeof STAGE_LABELS_AR;
  status: string | null;
  duplicate: boolean;
  existingLeadId: string | null;
  validationError: string | null;
}

export function ImportClient({ team }: { team: TeamMember[] }) {
  const [rows, setRows] = useState<ImportRow[] | null>(null);
  const [assignedRepId, setAssignedRepId] = useState('');
  const [pending, start] = useTransition();
  const dialog = useDialog();
  const router = useRouter();

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    start(async () => {
      try {
        const preview = (await api.imports.preview(file)) as ImportRow[];
        setRows(preview);
      } catch (err) {
        dialog.notify({
          title: 'فشل قراءة الملف',
          message: err instanceof ApiError ? err.message : (err as Error).message,
          tone: 'danger',
        });
      }
    });
  }

  function apply() {
    if (!rows) return;
    const applicable = rows.filter((r) => !r.validationError && !r.existingLeadId);
    if (applicable.length === 0) {
      dialog.notify({ title: 'لا توجد صفوف قابلة للاستيراد', tone: 'warn' });
      return;
    }
    start(async () => {
      try {
        const res = await api.imports.apply({
          rows: applicable,
          assignedRepId: assignedRepId || undefined,
        });
        dialog.notify({
          title: 'تم الاستيراد',
          message: `${res.created} أضيف · ${res.skipped} تم تخطيه`,
          tone: 'success',
        });
        setRows(null);
        router.push('/leads');
        router.refresh();
      } catch (err) {
        dialog.notify({
          title: 'فشل الاستيراد',
          message: err instanceof ApiError ? err.message : (err as Error).message,
          tone: 'danger',
        });
      }
    });
  }

  const okCount = rows?.filter((r) => !r.validationError && !r.existingLeadId).length ?? 0;
  const dupeCount = rows?.filter((r) => r.existingLeadId).length ?? 0;
  const errCount = rows?.filter((r) => r.validationError).length ?? 0;

  return (
    <div className="space-y-4">
      <div className="surface-strong p-5 flex flex-wrap items-end gap-3">
        <label className="text-xs text-ink-300">
          ملف Excel
          <input type="file" accept=".xlsx" onChange={onPick}
            className="block mt-1 text-sm text-ink-200 file:me-2 file:rounded-md file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-ink-900 file:text-sm file:font-medium" />
        </label>
        <label className="text-xs text-ink-300">
          إسناد إلى مندوب (اختياري)
          <select value={assignedRepId} onChange={(e) => setAssignedRepId(e.target.value)}
            className="block mt-1 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-ink-100">
            <option value="">— بلا —</option>
            {team.map((m) => (
              <option key={m.id} value={m.id}>{m.name ?? m.email}</option>
            ))}
          </select>
        </label>
        <button onClick={apply} disabled={pending || !rows || okCount === 0}
          className="inline-flex items-center gap-2 rounded-md bg-white text-ink-900 px-4 py-2 text-sm font-medium hover:bg-ink-100 disabled:opacity-50">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          استيراد {okCount ? `(${okCount})` : ''}
        </button>
      </div>

      {rows && (
        <>
          <div className="flex flex-wrap gap-3 text-xs">
            <span className="chip">إجمالي: {rows.length}</span>
            <span className="chip" style={{ color: '#6EE7B7' }}>سيتم استيراده: {okCount}</span>
            <span className="chip" style={{ color: '#FCD34D' }}>مكرر: {dupeCount}</span>
            <span className="chip" style={{ color: '#FCA5A5' }}>خطأ: {errCount}</span>
          </div>

          <div className="surface-strong overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-ink-400 border-b border-white/5">
                <tr>
                  <th className="px-4 py-2 text-start">#</th>
                  <th className="px-4 py-2 text-start">العميل</th>
                  <th className="px-4 py-2 text-start">الشركة</th>
                  <th className="px-4 py-2 text-start">الهاتف</th>
                  <th className="px-4 py-2 text-start">المصدر</th>
                  <th className="px-4 py-2 text-start">المرحلة</th>
                  <th className="px-4 py-2 text-start">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.index} className="border-b border-white/[0.04]">
                    <td className="px-4 py-2 text-ink-400 ltr-inline">{r.index}</td>
                    <td className="px-4 py-2 text-white">{r.clientName}</td>
                    <td className="px-4 py-2 text-ink-300">{r.companyName ?? '—'}</td>
                    <td className="px-4 py-2 text-ink-300 ltr-inline">{r.phone ?? '—'}</td>
                    <td className="px-4 py-2 text-ink-300">{SOURCE_LABELS_AR[r.source]}</td>
                    <td className="px-4 py-2 text-ink-300">{STAGE_LABELS_AR[r.stage]}</td>
                    <td className="px-4 py-2 text-xs">
                      {r.validationError ? (
                        <span className="text-rose-300">{r.validationError}</span>
                      ) : r.existingLeadId ? (
                        <span className="text-amber-300">موجود مسبقاً</span>
                      ) : (
                        <span className="text-emerald-300">جاهز</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
