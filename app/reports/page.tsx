import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { Shell } from '@/components/ui/shell';
import { PageHeader } from '@/components/ui/page-header';
import { api, ApiError, STAGE_LABELS_AR } from '@/lib/api';
import type { RepLeaderboardEntry } from '@/lib/types';
import { isManagerRole } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const cookieHeader = (await headers()).get('cookie') ?? '';
  let user;
  try {
    ({ user } = await api.me(cookieHeader));
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
    <Shell isManager={isManagerRole(user.role)}>
      <PageHeader
        title="تقارير المبيعات"
        subtitle={`القمع النشط · إجمالي متوقع ${pipelineValue.totalSar.toLocaleString('en-US')} SAR · ${pipelineValue.openLeads} عميل`}
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <section className="surface-strong h-fit p-5 md:p-6">
          <div className="text-sm font-semibold uppercase tracking-wider text-ink-300 mb-3">القمع</div>
          <ul className="space-y-3">
            {funnel.map((b) => (
              <li key={b.stage}>
                <div className="flex items-center justify-between text-base">
                  <span className="text-ink-100">{STAGE_LABELS_AR[b.stage]}</span>
                  <span className="text-white font-medium ltr-inline">{b.count}</span>
                </div>
                <div className="h-2.5 rounded-full bg-white/[0.12] overflow-hidden mt-1.5">
                  <div
                    className="h-full bg-emerald-400"
                    style={{ width: `${(b.count / maxCount) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="surface-strong h-fit p-5 md:p-6 overflow-x-auto">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-3">
            <div className="text-sm font-semibold uppercase tracking-wider text-ink-300">لوحة المندوبين</div>
            <form>
              <label className="block">
                <span className="form-label">الشهر</span>
                <input name="month" placeholder="YYYY-MM" defaultValue={month ?? ''}
                  dir="ltr" className="w-36" />
              </label>
            </form>
          </div>
          <table className="w-full min-w-[520px] text-sm">
            <thead className="text-xs uppercase tracking-wider text-ink-300 border-b border-white/10">
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
                <tr key={r.repId} className="border-b border-white/10">
                  <td className="py-3 text-white">{r.name}</td>
                  <td className="py-3 text-ink-200"><span className="ltr-inline">{r.open}</span></td>
                  <td className="py-3 text-emerald-300"><span className="ltr-inline">{r.won}</span></td>
                  <td className="py-3 text-ink-200"><span className="ltr-inline">{r.revenueSar.toLocaleString('en-US')}</span></td>
                  <td className="py-3 text-ink-200"><span className="ltr-inline">{r.attainment != null ? `${r.attainment}%` : '—'}</span></td>
                </tr>
              ))}
              {leaderboard.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-ink-300 py-6">لا توجد بيانات</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>
    </Shell>
  );
}
