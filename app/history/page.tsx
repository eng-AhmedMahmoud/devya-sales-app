import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import Link from 'next/link';
import { Shell } from '@/components/ui/shell';
import { PageHeader } from '@/components/ui/page-header';
import { api, ApiError, STAGE_LABELS_AR } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function HistoryPage() {
  const cookieHeader = (await headers()).get('cookie') ?? '';
  try {
    await api.me(cookieHeader);
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) redirect('/login');
    throw err;
  }
  const leads = await api.leads.list({}, cookieHeader);
  const closed = leads.filter((l) => l.outcome !== 'OPEN');

  return (
    <Shell>
      <PageHeader title="السجل" subtitle={`${closed.length} صفقة مغلقة`} />
      <div className="surface-strong overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wider text-ink-400 border-b border-white/5">
            <tr>
              <th className="text-start px-4 py-3">الكود</th>
              <th className="text-start px-4 py-3">العميل</th>
              <th className="text-start px-4 py-3">النتيجة</th>
              <th className="text-start px-4 py-3">المرحلة</th>
              <th className="text-start px-4 py-3">المندوب</th>
              <th className="text-start px-4 py-3">تاريخ الإغلاق</th>
            </tr>
          </thead>
          <tbody>
            {closed.map((l) => (
              <tr key={l.id} className="border-b border-white/[0.04]">
                <td className="px-4 py-3">
                  <Link href={`/leads/${l.id}`} className="ltr-inline text-emerald-300 hover:text-white">
                    {l.code}
                  </Link>
                </td>
                <td className="px-4 py-3 text-white">{l.clientName}</td>
                <td className="px-4 py-3">
                  <span className={l.outcome === 'WON' ? 'text-emerald-300' : 'text-rose-300'}>
                    {l.outcome}
                  </span>
                </td>
                <td className="px-4 py-3 text-ink-300">{STAGE_LABELS_AR[l.stage]}</td>
                <td className="px-4 py-3 text-ink-300">{l.assignedRepName ?? '—'}</td>
                <td className="px-4 py-3 text-ink-300 ltr-inline">
                  {(l.wonAt || l.lostAt) ? new Date(l.wonAt || l.lostAt!).toLocaleDateString('en-GB') : '—'}
                </td>
              </tr>
            ))}
            {closed.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-ink-500 py-10">لا توجد صفقات مغلقة</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
