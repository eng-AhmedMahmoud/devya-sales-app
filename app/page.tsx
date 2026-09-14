import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Shell } from '@/components/ui/shell';
import { PageHeader } from '@/components/ui/page-header';
import { PipelineBoard } from '@/components/pipeline/board';
import { api, ApiError } from '@/lib/api';
import { isManagerRole } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function PipelinePage() {
  const cookieHeader = (await headers()).get('cookie') ?? '';
  let user;
  try {
    ({ user } = await api.me(cookieHeader));
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
      redirect('/login');
    }
    throw err;
  }
  const { items: leads } = await api.leads.list({ pageSize: 200 }, cookieHeader);

  return (
    <Shell isManager={isManagerRole(user.role)}>
      <PageHeader
        title="قمع المبيعات"
        subtitle={`مرحباً ${user.name ?? user.email} — ${leads.length} عميل في القمع`}
        actions={
          <Link
            href="/leads/new"
            className="tap inline-flex items-center gap-2 rounded-md bg-white text-ink-900 px-5 text-sm font-semibold hover:bg-ink-200 ring-focus"
          >
            <Plus className="h-5 w-5" />
            إضافة عميل
          </Link>
        }
      />
      <PipelineBoard leads={leads} viewerId={user.id} isManager={isManagerRole(user.role)} />
    </Shell>
  );
}
