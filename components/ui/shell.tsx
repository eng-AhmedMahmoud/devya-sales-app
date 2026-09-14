import { Sidebar } from './sidebar';

/**
 * `isManager` gates the sidebar's `managerOnly` entries. Every page already
 * resolves the session server-side, so the flag is passed down rather than
 * re-fetched here.
 */
export function Shell({ children, isManager }: { children: React.ReactNode; isManager?: boolean }) {
  return (
    <div className="min-h-screen flex bg-grid">
      <Sidebar isManager={isManager} />
      <main className="flex-1 min-w-0">
        {/* px-5 on phones, px-8 from md up — a 1024px iPad keeps real content width. */}
        <div className="px-5 md:px-8 py-6 md:py-8 max-w-[1400px] mx-auto w-full">{children}</div>
      </main>
    </div>
  );
}
