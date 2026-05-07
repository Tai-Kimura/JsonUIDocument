// Custom 404. Lands when Next.js router does not resolve a path.
// Shape: dark hero + brief "lost?" copy + link back home + hint about ⌘+K.
// Kept server-rendered (no "use client") so the 404 is still SSR'd.

import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#0B1220] text-[#F9FAFB] flex flex-col items-center justify-center px-6 py-16">
      <div className="max-w-lg w-full text-center">
        <p className="text-[13px] font-semibold text-[#93C5FD] tracking-wide uppercase">
          404
        </p>
        <h1 className="mt-3 text-4xl sm:text-5xl font-bold leading-tight">
          Not here.
        </h1>
        <p className="mt-4 text-base text-[#CBD5F5] leading-relaxed">
          The page you asked for does not exist — maybe a stale link, maybe a
          page that moved. Try the site search (⌘K / Ctrl+K), or jump back home
          and pick a tab.
        </p>
        <div className="mt-8 flex gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center h-10 px-5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[14px] font-semibold transition-colors"
          >
            Back to home
          </Link>
          <Link
            href="/learn/installation"
            className="inline-flex items-center h-10 px-5 rounded-lg bg-[#1F2937] hover:bg-[#111827] text-[#F9FAFB] text-[14px] font-medium border border-[#374151] transition-colors"
          >
            Install in one line
          </Link>
        </div>
      </div>
    </main>
  );
}
