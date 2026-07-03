import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import Link from 'next/link';
import { Download, Plus } from 'lucide-react';
import { Shell } from '@/components/ui/shell';
import { PageHeader } from '@/components/ui/page-header';
import { LeadsListClient } from '@/components/lead/leads-list-client';
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
  let user;
  try {
    ({ user } = await api.me(cookieHeader));
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) redirect('/login');
    throw err;
  }
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const [{ items: leads, total, pageSize }, team] = await Promise.all([
    api.leads.list(
      { stage: sp.stage, source: sp.source, budget: sp.budget, q: sp.q, page },
      cookieHeader,
    ),
    api.team(cookieHeader).catch(() => []),
  ]);
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

      {/* Client component handles bulk mode + WhatsApp buttons */}
      <LeadsListClient
        leads={leads}
        user={user}
        team={team}
      />

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
