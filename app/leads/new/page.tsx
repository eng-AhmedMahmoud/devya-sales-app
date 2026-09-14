import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { Shell } from '@/components/ui/shell';
import { PageHeader } from '@/components/ui/page-header';
import { LeadForm } from '@/components/lead/lead-form';
import { api, ApiError } from '@/lib/api';
import type { TeamMember } from '@/lib/types';
import { isManagerRole } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function NewLeadPage() {
  const cookieHeader = (await headers()).get('cookie') ?? '';
  let user;
  try {
    ({ user } = await api.me(cookieHeader));
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) redirect('/login');
    throw err;
  }
  // Only a manager may assign a new client to someone else — a rep's client is
  // always their own (the backend forces it too), so the picker and the team
  // list it needs are manager-only.
  const manager = isManagerRole(user.role);
  let team: TeamMember[] = [];
  if (manager) {
    try {
      team = await api.team(cookieHeader);
    } catch {}
  }

  return (
    <Shell isManager={manager}>
      <PageHeader title="إضافة عميل جديد" subtitle="سجل بياناته وابدأ المتابعة" />
      <LeadForm team={team} isManager={manager} />
    </Shell>
  );
}
