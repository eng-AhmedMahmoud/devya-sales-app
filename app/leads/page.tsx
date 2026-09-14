import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import Link from 'next/link';
import { Download, Plus } from 'lucide-react';
import { Shell } from '@/components/ui/shell';
import { PageHeader } from '@/components/ui/page-header';
import { LeadsListClient } from '@/components/lead/leads-list-client';
import { api, ApiError, BUDGET_LABELS_AR, CLIENT_TYPE_LABELS_AR, SOURCE_LABELS_AR, STAGE_LABELS_AR } from '@/lib/api';
import type { LeadStage, LeadSource, BudgetBucket, ClientType } from '@/lib/types';
import { isManagerRole } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function LeadsListPage({
  searchParams,
}: {
  searchParams: Promise<{
    stage?: LeadStage;
    clientType?: ClientType;
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
      { stage: sp.stage, clientType: sp.clientType, source: sp.source, budget: sp.budget, q: sp.q, page },
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
    if (sp.clientType) params.set('clientType', sp.clientType);
    if (sp.source) params.set('source', sp.source);
    if (sp.budget) params.set('budget', sp.budget);
    if (p > 1) params.set('page', String(p));
    const s = params.toString();
    return s ? `/leads?${s}` : '/leads';
  };

  return (
    <Shell isManager={isManagerRole(user.role)}>
      <PageHeader
        title="قائمة العملاء"
        subtitle={`${total} عميل`}
        actions={
          <div className="flex items-center gap-2">
            <a
              href={api.exportUrl({ stage: sp.stage, clientType: sp.clientType, source: sp.source, budget: sp.budget, q: sp.q })}
              className="tap inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/[0.06] px-4 text-sm font-medium text-ink-100 hover:bg-white/[0.12] hover:border-white/30 ring-focus"
            >
              <Download className="h-4 w-4" />
              تصدير XLSX
            </a>
            <Link
              href="/leads/new"
              className="tap inline-flex items-center gap-2 rounded-md bg-white text-ink-900 px-4 text-sm font-semibold hover:bg-ink-200 ring-focus"
            >
              <Plus className="h-5 w-5" />
              إضافة
            </Link>
          </div>
        }
      />

      {/* Filters stack on a phone, two-up on a tablet, one row on a desktop. */}
      <form className="surface-strong h-fit p-4 md:p-5 mb-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 items-end">
        <label className="block">
          <span className="form-label">بحث</span>
          <input name="q" defaultValue={sp.q ?? ''} placeholder="اسم / شركة / رقم" />
        </label>
        <label className="block">
          <span className="form-label">المرحلة</span>
          <select name="stage" defaultValue={sp.stage ?? ''}>
            <option value="">الكل</option>
            {Object.entries(STAGE_LABELS_AR).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="form-label">نوع العميل</span>
          <select name="clientType" defaultValue={sp.clientType ?? ''}>
            <option value="">الكل</option>
            {Object.entries(CLIENT_TYPE_LABELS_AR).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="form-label">المصدر</span>
          <select name="source" defaultValue={sp.source ?? ''}>
            <option value="">الكل</option>
            {Object.entries(SOURCE_LABELS_AR).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="form-label">الميزانية</span>
          <select name="budget" defaultValue={sp.budget ?? ''}>
            <option value="">الكل</option>
            {Object.entries(BUDGET_LABELS_AR).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="sm:col-span-2 xl:col-span-5 xl:justify-self-start rounded-md bg-white text-ink-900 px-6 text-sm font-semibold hover:bg-ink-200 ring-focus"
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
        <div className="mt-5 flex items-center justify-between gap-2 text-sm">
          {page > 1 ? (
            <Link
              href={pageHref(page - 1)}
              className="tap inline-flex items-center rounded-md border border-white/20 bg-white/[0.06] px-4 font-medium text-ink-100 hover:bg-white/[0.12] ring-focus"
            >
              السابق
            </Link>
          ) : (
            <span className="tap inline-flex items-center rounded-md border border-white/10 px-4 text-ink-450">
              السابق
            </span>
          )}

          <span className="text-ink-300">
            صفحة {page} من {pageCount}
          </span>

          {page < pageCount ? (
            <Link
              href={pageHref(page + 1)}
              className="tap inline-flex items-center rounded-md border border-white/20 bg-white/[0.06] px-4 font-medium text-ink-100 hover:bg-white/[0.12] ring-focus"
            >
              التالي
            </Link>
          ) : (
            <span className="tap inline-flex items-center rounded-md border border-white/10 px-4 text-ink-450">
              التالي
            </span>
          )}
        </div>
      )}
    </Shell>
  );
}
