import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { Shell } from '@/components/ui/shell';
import { PageHeader } from '@/components/ui/page-header';
import { TargetsClient } from '@/components/targets/targets-client';
import { api, ApiError } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function TargetsPage() {
  const cookieHeader = (await headers()).get('cookie') ?? '';
  try {
    const { user } = await api.me(cookieHeader);
    if (!['SALES_MANAGER', 'SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
      redirect('/');
    }
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) redirect('/login');
    throw err;
  }
  const [targets, team] = await Promise.all([
    api.targets.list(undefined, cookieHeader).catch(() => []),
    api.team(cookieHeader).catch(() => []),
  ]);

  return (
    <Shell>
      <PageHeader title="أهداف المندوبين" subtitle="حدد هدف الإيراد الشهري لكل مندوب" />
      <TargetsClient targets={targets} team={team} />
    </Shell>
  );
}
