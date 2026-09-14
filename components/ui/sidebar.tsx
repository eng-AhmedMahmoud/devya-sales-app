'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSyncExternalStore, useTransition } from 'react';
import {
  BarChart3,
  CalendarDays,
  Eye,
  ExternalLink,
  FileSignature,
  History,
  Kanban,
  ListChecks,
  Loader2,
  LogOut,
  PanelRightClose,
  PanelRightOpen,
  Target,
  Upload,
  UserPlus,
} from 'lucide-react';
import { DevyaLogo } from './devya-logo';
import { api } from '@/lib/api';
import { appConfig } from '@/lib/config';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  managerOnly?: boolean;
}

const PRIMARY_NAV: NavItem[] = [
  { href: '/', label: 'قمع المبيعات', icon: Kanban, exact: true },
  { href: '/leads', label: 'قائمة العملاء', icon: ListChecks },
  { href: '/leads/new', label: 'إضافة عميل', icon: UserPlus },
  { href: '/reports', label: 'التقارير', icon: BarChart3 },
  { href: '/history', label: 'السجل', icon: History },
  { href: '/targets', label: 'الأهداف', icon: Target, managerOnly: true },
  { href: '/import', label: 'استيراد', icon: Upload, managerOnly: true },
  { href: '/visibility', label: 'صلاحيات الرؤية', icon: Eye, managerOnly: true },
];

const TOOL_NAV: { href: string; label: string; icon: React.ComponentType<{ className?: string }>; sub: string }[] = [
  ...(appConfig.tasksUrl ? [{ href: appConfig.tasksUrl, label: 'المهام', icon: ListChecks, sub: 'إدارة المهام' }] : []),
  ...(appConfig.contractsUrl ? [{ href: appConfig.contractsUrl, label: 'العقود', icon: FileSignature, sub: 'إصدار العقود' }] : []),
  ...(appConfig.adminUrl ? [{ href: appConfig.adminUrl, label: 'الإدارة', icon: CalendarDays, sub: 'الحجوزات والمحتوى' }] : []),
];

// Collapsed state is persisted so an iPad keeps the icon rail between visits.
// localStorage is an external store: SSR gets the "expanded" snapshot and the
// client re-reads it after hydration, so there is no markup mismatch.
const COLLAPSE_KEY = 'devya-sales-sidebar-collapsed';
const collapseListeners = new Set<() => void>();

function subscribeCollapsed(onChange: () => void) {
  collapseListeners.add(onChange);
  window.addEventListener('storage', onChange);
  return () => {
    collapseListeners.delete(onChange);
    window.removeEventListener('storage', onChange);
  };
}

function readCollapsed() {
  try {
    return window.localStorage.getItem(COLLAPSE_KEY) === '1';
  } catch {
    return false;
  }
}

function writeCollapsed(next: boolean) {
  try {
    window.localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
  } catch {}
  collapseListeners.forEach((notify) => notify());
}

export function Sidebar({ isManager }: { isManager?: boolean } = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, start] = useTransition();
  const collapsed = useSyncExternalStore(subscribeCollapsed, readCollapsed, () => false);

  function handleLogout() {
    start(async () => {
      try { await api.logout(); } catch {}
      router.push('/login');
      router.refresh();
    });
  }

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + '/');

  const items = PRIMARY_NAV.filter((i) => !i.managerOnly || isManager);

  return (
    <aside
      className={cn(
        'hidden lg:flex shrink-0 flex-col border-l border-white/10 bg-ink-825',
        collapsed ? 'w-[72px]' : 'w-60 xl:w-64',
      )}
    >
      <div
        className={cn(
          'px-3 py-4 flex items-center gap-2 border-b border-white/10',
          collapsed ? 'justify-center' : 'justify-between',
        )}
      >
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <DevyaLogo width={96} />
            <span className="chip">Sales</span>
          </div>
        )}
        <button
          type="button"
          onClick={() => writeCollapsed(!collapsed)}
          title={collapsed ? 'توسيع القائمة' : 'طي القائمة'}
          aria-label={collapsed ? 'توسيع القائمة' : 'طي القائمة'}
          aria-expanded={!collapsed}
          className="tap-box rounded-md text-ink-300 hover:text-white hover:bg-white/[0.08] transition-colors ring-focus"
        >
          {collapsed ? <PanelRightOpen className="h-5 w-5" /> : <PanelRightClose className="h-5 w-5" />}
        </button>
      </div>

      <nav className={cn('flex-1 overflow-y-auto py-4 space-y-5', collapsed ? 'px-2' : 'px-3')}>
        <div>
          {!collapsed && (
            <div className="px-2 mb-2 text-xs uppercase tracking-wider text-ink-300 font-semibold">
              المساحة
            </div>
          )}
          <ul className="space-y-1">
            {items.map((item) => (
              <NavLink key={item.label} item={item} active={isActive(item)} collapsed={collapsed} />
            ))}
          </ul>
        </div>

        {TOOL_NAV.length > 0 && (
          <div>
            {!collapsed && (
              <div className="px-2 mb-2 text-xs uppercase tracking-wider text-ink-300 font-semibold">
                أدوات
              </div>
            )}
            <ul className="space-y-1">
              {TOOL_NAV.map((t) => {
                const Icon = t.icon;
                return (
                  <li key={t.label}>
                    <a
                      href={t.href}
                      target="_blank"
                      rel="noreferrer"
                      title={t.label}
                      className={cn(
                        'tap flex items-center gap-2.5 rounded-md text-sm text-ink-200 hover:text-white hover:bg-white/[0.08] border border-transparent transition-colors ring-focus group',
                        collapsed ? 'justify-center px-0' : 'justify-between px-3',
                      )}
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <Icon className="h-5 w-5 shrink-0" />
                        {!collapsed && <span className="truncate">{t.label}</span>}
                      </span>
                      {!collapsed && <ExternalLink className="h-4 w-4 text-ink-300 group-hover:text-white shrink-0" />}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </nav>

      <div className={cn('pb-3', collapsed ? 'px-2' : 'px-3')}>
        <button
          onClick={handleLogout}
          disabled={pending}
          title="تسجيل الخروج"
          className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-white/20 bg-white/[0.06] px-3 text-sm font-medium text-ink-100 hover:bg-white/[0.12] hover:border-white/30 transition-colors disabled:opacity-60 ring-focus"
        >
          {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogOut className="h-5 w-5" />}
          {!collapsed && 'تسجيل الخروج'}
        </button>
      </div>
    </aside>
  );
}

function NavLink({ item, active, collapsed }: { item: NavItem; active: boolean; collapsed: boolean }) {
  const Icon = item.icon;
  return (
    <li>
      <Link
        href={item.href}
        title={item.label}
        className={cn(
          'tap flex items-center gap-2.5 rounded-md text-sm font-medium transition-colors ring-focus',
          collapsed ? 'justify-center px-0' : 'px-3',
          active
            ? 'bg-white/[0.12] text-white border border-white/25'
            : 'text-ink-200 hover:text-white hover:bg-white/[0.08] border border-transparent',
        )}
      >
        <Icon className="h-5 w-5 shrink-0" />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </Link>
    </li>
  );
}
