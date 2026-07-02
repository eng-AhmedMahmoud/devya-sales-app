'use client';

import { useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { api, ApiError } from '@/lib/api';

const FORGOT_PASSWORD_URL = `${process.env.NEXT_PUBLIC_ADMIN_URL ?? 'https://admin.devya-solutions.com'}/forgot-password`;

export function LoginForm() {
  const params = useSearchParams();
  const from = params.get('from') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      try {
        await api.login(email, password);
        window.location.assign(from);
      } catch (err) {
        if (err instanceof ApiError) setError(err.message || 'بيانات غير صحيحة');
        else setError('تعذر الاتصال بالخادم');
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block">
        <span className="block text-xs font-medium text-ink-300 mb-1.5">البريد</span>
        <input
          type="email"
          autoComplete="email"
          autoFocus
          required
          dir="ltr"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-white/10 bg-white/[0.03] px-3 py-2.5 text-[15px] text-ink-100 placeholder:text-ink-500 focus:outline-none focus:border-white/30 focus:bg-white/[0.05] ring-focus"
          placeholder="you@devya.dev"
        />
      </label>
      <label className="block">
        <span className="block text-xs font-medium text-ink-300 mb-1.5">كلمة المرور</span>
        <input
          type="password"
          autoComplete="current-password"
          required
          dir="ltr"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border border-white/10 bg-white/[0.03] px-3 py-2.5 text-[15px] text-ink-100 placeholder:text-ink-500 focus:outline-none focus:border-white/30 focus:bg-white/[0.05] ring-focus"
          placeholder="••••••••"
        />
      </label>
      <div className="flex justify-end">
        <a href={FORGOT_PASSWORD_URL} className="text-xs text-ink-400 hover:text-ink-200 transition-colors">
          نسيت كلمة المرور؟
        </a>
      </div>
      {error && (
        <div className="text-sm text-rose-300 rounded-md border border-rose-500/30 bg-rose-500/[0.08] px-3 py-2">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-white px-4 py-2.5 text-sm font-medium text-ink-900 hover:bg-ink-200 disabled:opacity-60 ring-focus"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        تسجيل الدخول
      </button>
    </form>
  );
}
