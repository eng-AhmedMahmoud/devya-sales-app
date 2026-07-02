import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Shell } from '@/components/ui/shell';
import { PageHeader } from '@/components/ui/page-header';
import { PipelineBoard } from '@/components/pipeline/board';
import { api, ApiError } from '@/lib/api';

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
  const leads = await api.leads.list({}, cookieHeader);

  return (
    <Shell>
      <PageHeader
        title="قمع المبيعات"
        subtitle={`مرحباً ${user.name ?? user.email} — ${leads.length} عميل في القمع`}
        actions={
          <Link
            href="/leads/new"
            className="inline-flex items-center gap-2 rounded-md bg-white text-ink-900 px-3 py-2 text-sm font-medium hover:bg-ink-100 ring-focus"
          >
            <Plus className="h-4 w-4" />
            إضافة عميل
          </Link>
        }
      />
      <PipelineBoard leads={leads} />
    </Shell>
  );
}
