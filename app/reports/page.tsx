import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { Shell } from '@/components/ui/shell';
import { PageHeader } from '@/components/ui/page-header';
import { api, ApiError, STAGE_LABELS_AR } from '@/lib/api';
import type { RepLeaderboardEntry } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const cookieHeader = (await headers()).get('cookie') ?? '';
  try {
    await api.me(cookieHeader);
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) redirect('/login');
    throw err;
  }
  const { month } = await searchParams;
  const [funnel, leaderboardRaw, pipelineValue] = await Promise.all([
    api.reports.funnel(cookieHeader),
    api.reports.leaderboard(month, cookieHeader),
    api.reports.pipelineValue(cookieHeader),
  ]);
  const leaderboard: RepLeaderboardEntry[] = Array.isArray(leaderboardRaw)
    ? leaderboardRaw
    : [leaderboardRaw];
  const maxCount = Math.max(1, ...funnel.map((f) => f.count));

  return (
    <Shell>
      <PageHeader
        title="تقارير المبيعات"
        subtitle={`القمع النشط · إجمالي متوقع ${pipelineValue.totalSar.toLocaleString('en-US')} SAR · ${pipelineValue.openLeads} عميل`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="surface-strong p-5">
          <div className="text-xs uppercase tracking-wider text-ink-400 mb-3">القمع</div>
          <ul className="space-y-2">
            {funnel.map((b) => (
              <li key={b.stage}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-200">{STAGE_LABELS_AR[b.stage]}</span>
                  <span className="text-white ltr-inline">{b.count}</span>
                </div>
                <div className="h-2 rounded-full bg-white/[0.05] overflow-hidden mt-1">
                  <div
                    className="h-full bg-emerald-500/60"
                    style={{ width: `${(b.count / maxCount) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="surface-strong p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs uppercase tracking-wider text-ink-400">لوحة المندوبين</div>
            <form>
              <input
                name="month"
                placeholder="YYYY-MM"
                defaultValue={month ?? ''}
                className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-xs text-ink-100 ltr-inline w-24"
              />
            </form>
          </div>
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-ink-400 border-b border-white/5">
              <tr>
                <th className="text-start py-2">المندوب</th>
                <th className="text-start py-2">مفتوح</th>
                <th className="text-start py-2">فوز</th>
                <th className="text-start py-2">إيراد</th>
                <th className="text-start py-2">التحقيق</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((r) => (
                <tr key={r.repId} className="border-b border-white/[0.04]">
                  <td className="py-2 text-white">{r.name}</td>
                  <td className="py-2 ltr-inline">{r.open}</td>
                  <td className="py-2 ltr-inline text-emerald-300">{r.won}</td>
                  <td className="py-2 ltr-inline">{r.revenueSar.toLocaleString('en-US')}</td>
                  <td className="py-2 ltr-inline">{r.attainment != null ? `${r.attainment}%` : '—'}</td>
                </tr>
              ))}
              {leaderboard.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-ink-500 py-6">لا توجد بيانات</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>
    </Shell>
  );
}
