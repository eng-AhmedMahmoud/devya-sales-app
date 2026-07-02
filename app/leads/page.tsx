import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import Link from 'next/link';
import { Download, Plus } from 'lucide-react';
import { Shell } from '@/components/ui/shell';
import { PageHeader } from '@/components/ui/page-header';
import { api, ApiError, BUDGET_LABELS_AR, SOURCE_LABELS_AR, STAGE_LABELS_AR } from '@/lib/api';
import type { LeadStage, LeadSource, BudgetBucket } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function LeadsListPage({
  searchParams,
}: {
  searchParams: Promise<{
    stage?: LeadStage;
    source?: LeadSource;
    budget?: BudgetBucket;
    q?: string;
    page?: string;
  }>;
}) {
  const cookieHeader = (await headers()).get('cookie') ?? '';
  try {
    await api.me(cookieHeader);
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) redirect('/login');
    throw err;
  }
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const { items: leads, total, pageSize } = await api.leads.list(
    { stage: sp.stage, source: sp.source, budget: sp.budget, q: sp.q, page },
    cookieHeader,
  );
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  // Preserve active filters when moving between pages.
  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    if (sp.q) params.set('q', sp.q);
    if (sp.stage) params.set('stage', sp.stage);
    if (sp.source) params.set('source', sp.source);
    if (sp.budget) params.set('budget', sp.budget);
    if (p > 1) params.set('page', String(p));
    const s = params.toString();
    return s ? `/leads?${s}` : '/leads';
  };

  return (
    <Shell>
      <PageHeader
        title="قائمة العملاء"
        subtitle={`${total} عميل`}
        actions={
          <div className="flex items-center gap-2">
            <a
              href={api.exportUrl({ stage: sp.stage, source: sp.source, budget: sp.budget, q: sp.q })}
              className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.02] px-3 py-1.5 text-sm text-ink-200 hover:bg-white/5"
            >
              <Download className="h-3.5 w-3.5" />
              تصدير XLSX
            </a>
            <Link
              href="/leads/new"
              className="inline-flex items-center gap-2 rounded-md bg-white text-ink-900 px-3 py-1.5 text-sm font-medium hover:bg-ink-100"
            >
              <Plus className="h-4 w-4" />
              إضافة
            </Link>
          </div>
        }
      />

      <form className="surface-strong p-3 mb-4 flex flex-wrap items-end gap-2">
        <label className="text-xs text-ink-300">
          بحث
          <input
            name="q"
            defaultValue={sp.q ?? ''}
            placeholder="اسم / شركة / رقم"
            className="block mt-1 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-ink-100 w-56"
          />
        </label>
        <label className="text-xs text-ink-300">
          المرحلة
          <select
            name="stage"
            defaultValue={sp.stage ?? ''}
            className="block mt-1 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-ink-100"
          >
            <option value="">الكل</option>
            {Object.entries(STAGE_LABELS_AR).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </label>
        <label className="text-xs text-ink-300">
          المصدر
          <select
            name="source"
            defaultValue={sp.source ?? ''}
            className="block mt-1 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-ink-100"
          >
            <option value="">الكل</option>
            {Object.entries(SOURCE_LABELS_AR).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </label>
        <label className="text-xs text-ink-300">
          الميزانية
          <select
            name="budget"
            defaultValue={sp.budget ?? ''}
            className="block mt-1 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-ink-100"
          >
            <option value="">الكل</option>
            {Object.entries(BUDGET_LABELS_AR).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded-md bg-white text-ink-900 px-3 py-2 text-sm font-medium hover:bg-ink-100"
        >
          تصفية
        </button>
      </form>

      <div className="surface-strong overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wider text-ink-400 border-b border-white/5">
            <tr>
              <th className="text-start px-4 py-3">الكود</th>
              <th className="text-start px-4 py-3">العميل</th>
              <th className="text-start px-4 py-3">الشركة</th>
              <th className="text-start px-4 py-3">الهاتف</th>
              <th className="text-start px-4 py-3">المصدر</th>
              <th className="text-start px-4 py-3">الميزانية</th>
              <th className="text-start px-4 py-3">المرحلة</th>
              <th className="text-start px-4 py-3">المندوب</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                <td className="px-4 py-3">
                  <Link href={`/leads/${l.id}`} className="ltr-inline text-emerald-300 hover:text-white">
                    {l.code}
                  </Link>
                </td>
                <td className="px-4 py-3 text-white">{l.clientName}</td>
                <td className="px-4 py-3 text-ink-300">{l.companyName ?? '—'}</td>
                <td className="px-4 py-3 text-ink-300 ltr-inline">{l.phone ?? '—'}</td>
                <td className="px-4 py-3 text-ink-300">{SOURCE_LABELS_AR[l.source]}</td>
                <td className="px-4 py-3 text-ink-300">{BUDGET_LABELS_AR[l.budget]}</td>
                <td className="px-4 py-3 text-ink-300">{STAGE_LABELS_AR[l.stage]}</td>
                <td className="px-4 py-3 text-ink-300">{l.assignedRepName ?? '—'}</td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center text-ink-500 py-10">
                  لا توجد نتائج
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div className="mt-4 flex items-center justify-between gap-2 text-sm">
          {page > 1 ? (
            <Link
              href={pageHref(page - 1)}
              className="inline-flex items-center rounded-md border border-white/10 bg-white/[0.02] px-3 py-1.5 text-ink-200 hover:bg-white/5"
            >
              السابق
            </Link>
          ) : (
            <span className="inline-flex items-center rounded-md border border-white/5 px-3 py-1.5 text-ink-600">
              السابق
            </span>
          )}

          <span className="text-ink-400">
            صفحة {page} من {pageCount}
          </span>

          {page < pageCount ? (
            <Link
              href={pageHref(page + 1)}
              className="inline-flex items-center rounded-md border border-white/10 bg-white/[0.02] px-3 py-1.5 text-ink-200 hover:bg-white/5"
            >
              التالي
            </Link>
          ) : (
            <span className="inline-flex items-center rounded-md border border-white/5 px-3 py-1.5 text-ink-600">
              التالي
            </span>
          )}
        </div>
      )}
    </Shell>
  );
}
