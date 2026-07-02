import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { Shell } from '@/components/ui/shell';
import { PageHeader } from '@/components/ui/page-header';
import { LeadForm } from '@/components/lead/lead-form';
import { api, ApiError } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function NewLeadPage() {
  const cookieHeader = (await headers()).get('cookie') ?? '';
  try {
    await api.me(cookieHeader);
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) redirect('/login');
    throw err;
  }
  let team: Awaited<ReturnType<typeof api.team>> = [];
  try {
    team = await api.team(cookieHeader);
  } catch {}

  return (
    <Shell>
      <PageHeader title="إضافة عميل جديد" subtitle="سجل بياناته وابدأ المتابعة" />
      <LeadForm team={team} />
    </Shell>
  );
}
