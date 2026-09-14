import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { DevyaLogo } from '@/components/ui/devya-logo';
import { LoginForm } from '@/components/auth/login-form';
import { api, ApiError } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const cookieHeader = (await headers()).get('cookie') ?? '';
  if (cookieHeader) {
    try {
      await api.me(cookieHeader);
      redirect('/');
    } catch (err) {
      if (err instanceof ApiError && err.status !== 401 && err.status !== 403) throw err;
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-grid px-5 py-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-2 mb-8">
          <DevyaLogo width={120} />
          <span className="chip">Sales</span>
        </div>
        <div className="surface-strong h-fit p-6">
          <h1 className="text-xl font-semibold text-white mb-1">تسجيل الدخول</h1>
          <p className="text-base text-ink-300 mb-5">وصول داخلي لفريق المبيعات فقط.</p>
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
        <p className="mt-6 text-center text-sm text-ink-300">
          مشاكل تسجيل الدخول؟ تواصل مع المشرف.
        </p>
      </div>
    </div>
  );
}
