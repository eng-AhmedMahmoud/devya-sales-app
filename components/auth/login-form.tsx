'use client';

import { useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, MailCheck } from 'lucide-react';
import { api, ApiError } from '@/lib/api';

const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL ?? 'https://admin.devya-solutions.com';
const FORGOT_PASSWORD_URL = `${ADMIN_URL}/forgot-password`;
const CHANGE_PASSWORD_URL = `${ADMIN_URL}/account/password?required=1`;

const INPUT_CLASS =
  'w-full rounded-md border border-white/10 bg-white/[0.03] px-3 py-2.5 text-[15px] text-ink-100 placeholder:text-ink-500 focus:outline-none focus:border-white/30 focus:bg-white/[0.05] ring-focus';

export function LoginForm() {
  const params = useSearchParams();
  const from = params.get('from') || '/';
  const safeFrom = from.startsWith('/') && !from.startsWith('//') ? from : '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  // 'credentials' -> تسجيل دخول عادي؛ 'verify-email' -> الخادم أرسل رمز تحقق
  // ورفض فتح الجلسة حتى يتم تأكيد البريد.
  const [step, setStep] = useState<'credentials' | 'verify-email'>('credentials');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, start] = useTransition();

  async function doLogin() {
    const res = await api.login(email, password);
    window.location.assign(res.user.mustChangePassword ? CHANGE_PASSWORD_URL : safeFrom);
  }

  function submitCredentials(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      try {
        await doLogin();
      } catch (err) {
        if (err instanceof ApiError) {
          if (err.message === 'EMAIL_NOT_VERIFIED') {
            setStep('verify-email');
            setNotice(`أرسلنا رمز تحقق من 6 أرقام إلى ${email}. أدخله بالأسفل لتأكيد حسابك.`);
          } else {
            setError(err.message || 'بيانات غير صحيحة');
          }
        } else {
          setError('تعذر الاتصال بالخادم');
        }
      }
    });
  }

  function submitCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      try {
        await api.verifyEmail(email, code);
        // تم تأكيد البريد — نعيد تسجيل الدخول بالبيانات المحفوظة.
        await doLogin();
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message || 'الرمز غير صحيح أو منتهي الصلاحية');
        } else {
          setError('تعذر الاتصال بالخادم');
        }
      }
    });
  }

  function resend() {
    setError(null);
    start(async () => {
      try {
        await api.resendVerification(email);
        setNotice(`تم إرسال رمز جديد إلى ${email}.`);
      } catch {
        setError('تعذر إعادة إرسال الرمز. حاول مرة أخرى بعد دقيقة.');
      }
    });
  }

  if (step === 'verify-email') {
    return (
      <form onSubmit={submitCode} className="space-y-3">
        {notice && (
          <div className="flex items-start gap-2.5 rounded-md border border-emerald-500/30 bg-emerald-500/[0.08] px-3 py-2.5 text-sm text-emerald-200">
            <MailCheck className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{notice}</span>
          </div>
        )}
        <label className="block">
          <span className="block text-xs font-medium text-ink-300 mb-1.5">رمز التحقق</span>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            autoFocus
            required
            dir="ltr"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            className={`${INPUT_CLASS} text-center tracking-[0.5em] font-mono text-lg`}
            placeholder="••••••"
          />
        </label>
        {error && (
          <div className="text-sm text-rose-300 rounded-md border border-rose-500/30 bg-rose-500/[0.08] px-3 py-2">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={pending || code.length !== 6}
          className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-white px-4 py-2.5 text-sm font-medium text-ink-900 hover:bg-ink-200 disabled:opacity-60 ring-focus"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          تأكيد وتسجيل الدخول
        </button>
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={resend}
            disabled={pending}
            className="text-xs text-ink-400 hover:text-ink-200 transition-colors disabled:opacity-60"
          >
            إعادة إرسال الرمز
          </button>
          <button
            type="button"
            onClick={() => {
              setStep('credentials');
              setCode('');
              setNotice(null);
              setError(null);
            }}
            className="text-xs text-ink-400 hover:text-ink-200 transition-colors"
          >
            العودة لتسجيل الدخول
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={submitCredentials} className="space-y-3">
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
          className={INPUT_CLASS}
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
          className={INPUT_CLASS}
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
