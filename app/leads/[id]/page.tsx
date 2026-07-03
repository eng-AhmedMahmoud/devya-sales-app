import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { Shell } from '@/components/ui/shell';
import { PageHeader } from '@/components/ui/page-header';
import { LeadDetailClient } from '@/components/lead/lead-detail-client';
import { api, ApiError } from '@/lib/api';

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
    if (err instanceof ApiError && err.status === 404) {
      return (
        <Shell>
          <PageHeader title="العميل غير موجود" />
        </Shell>
      );
    }
    throw err;
  }

  return (
    <Shell>
      <PageHeader title={lead.clientName} subtitle={`${lead.code} · ${lead.companyName ?? ''}`} />
      <LeadDetailClient lead={lead} user={user} />
    </Shell>
  );
}
