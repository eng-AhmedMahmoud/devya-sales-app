import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { Shell } from '@/components/ui/shell';
import { PageHeader } from '@/components/ui/page-header';
import { VisibilityClient } from '@/components/visibility/visibility-client';
import { api, ApiError } from '@/lib/api';
import { isManagerRole } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function VisibilityPage() {
  const cookieHeader = (await headers()).get('cookie') ?? '';
  try {
    const { user } = await api.me(cookieHeader);
    if (!isManagerRole(user.role)) {
      redirect('/');
    }
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) redirect('/login');
    throw err;
  }
  const overview = await api.visibility.reps('SALES', cookieHeader);

  return (
    <Shell isManager>
      <PageHeader
        title="صلاحيات رؤية العملاء"
        subtitle="حدد من يرى عملاء من داخل فريق المبيعات"
      />
      <VisibilityClient overview={overview} />
    </Shell>
  );
}
