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
      <div className="surface-strong h-fit p-5 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
        <label className="block">
          <span className="form-label">ملف Excel</span>
          <input type="file" accept=".xlsx" onChange={onPick}
            className="block w-full text-sm text-ink-200 file:me-3 file:rounded-md file:border-0 file:bg-white file:px-4 file:py-2.5 file:text-ink-900 file:text-sm file:font-semibold" />
        </label>
        <label className="block">
          <span className="form-label">إسناد إلى مندوب (اختياري)</span>
          <select value={assignedRepId} onChange={(e) => setAssignedRepId(e.target.value)}>
            <option value="">— بلا —</option>
            {team.map((m) => (
              <option key={m.id} value={m.id}>{m.name ?? m.email}</option>
            ))}
          </select>
        </label>
        <button onClick={apply} disabled={pending || !rows || okCount === 0}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-white text-ink-900 px-5 text-base font-semibold hover:bg-ink-200 disabled:opacity-50 ring-focus">
          {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
          استيراد {okCount ? `(${okCount})` : ''}
        </button>
      </div>

      {rows && (
        <>
          <div className="flex flex-wrap gap-3">
            <span className="chip">إجمالي: {rows.length}</span>
            <span className="chip" style={{ color: '#6EE7B7' }}>سيتم استيراده: {okCount}</span>
            <span className="chip" style={{ color: '#FCD34D' }}>مكرر: {dupeCount}</span>
            <span className="chip" style={{ color: '#FCA5A5' }}>خطأ: {errCount}</span>
          </div>

          <div className="surface-strong overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="text-xs uppercase tracking-wider text-ink-300 border-b border-white/10">
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
                  <tr key={r.index} className="border-b border-white/10">
                    <td className="px-4 py-2.5 text-ink-300"><span className="ltr-inline">{r.index}</span></td>
                    <td className="px-4 py-2.5 text-white">{r.clientName}</td>
                    <td className="px-4 py-2.5 text-ink-200">{r.companyName ?? '—'}</td>
                    <td className="px-4 py-2.5 text-ink-200"><span className="ltr-inline">{r.phone ?? '—'}</span></td>
                    <td className="px-4 py-2.5 text-ink-200">{SOURCE_LABELS_AR[r.source]}</td>
                    <td className="px-4 py-2.5 text-ink-200">{STAGE_LABELS_AR[r.stage]}</td>
                    <td className="px-4 py-2.5 text-sm">
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
