import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { Shell } from '@/components/ui/shell';
import { PageHeader } from '@/components/ui/page-header';
import { ImportClient } from '@/components/import/import-client';
import { api, ApiError } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function ImportPage() {
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
  const team = await api.team(cookieHeader).catch(() => []);

  return (
    <Shell>
      <PageHeader title="استيراد عملاء من Excel" subtitle="ارفع ملف .xlsx — راجع الصفوف — طبّق" />
      <ImportClient team={team} />
    </Shell>
  );
}
