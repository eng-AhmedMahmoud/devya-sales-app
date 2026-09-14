import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { Shell } from '@/components/ui/shell';
import { PageHeader } from '@/components/ui/page-header';
import { LeadDetailClient } from '@/components/lead/lead-detail-client';
import { api, ApiError } from '@/lib/api';
import { isManagerRole } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieHeader = (await headers()).get('cookie') ?? '';
  let user;
  try {
    ({ user } = await api.me(cookieHeader));
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) redirect('/login');
    throw err;
  }
  let lead;
  try {
    lead = await api.leads.get(id, cookieHeader);
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 401) redirect('/login');
      // 403 is what a rep gets for a lead outside their visible set — a pasted
      // id, or a link that outlived its visibility grant. Answering it exactly
      // as a lead that never existed keeps the card from leaking which ids are
      // real, and keeps the server component from throwing to the error page.
      if (err.status === 403 || err.status === 404) {
        return (
          <Shell isManager={isManagerRole(user.role)}>
            <PageHeader title="العميل غير موجود" />
          </Shell>
        );
      }
    }
    throw err;
  }

  // A visibility grant is sight only (spec §2.2): a rep who reached this lead
  // through one may read it and nothing more. Resolved on the server so no
  // mutation control ever paints before it is known to be usable.
  const canWrite = isManagerRole(user.role) || lead.assignedRepId === user.id;

  return (
    <Shell isManager={isManagerRole(user.role)}>
      <PageHeader title={lead.clientName} subtitle={`${lead.code} · ${lead.companyName ?? ''}`} />
      <LeadDetailClient lead={lead} user={user} canWrite={canWrite} />
    </Shell>
  );
}
