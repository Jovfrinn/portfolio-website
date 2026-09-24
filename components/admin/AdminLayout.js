import Link from "next/link";
import { useRouter } from "next/router";

const MENU = [
  { href: "/admin/hero", label: "Hero" },
  { href: "/admin/status-card", label: "Status Card" },
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/services", label: "Services" },
  { href: "/admin/how-it-works", label: "How I Work" },
  { href: "/admin/about", label: "About" },
  { href: "/admin/tech-stack", label: "Tech Stack" },
  { href: "/admin/contact-social", label: "Contact & Social" },
  { href: "/admin/cta", label: "CTA" },
  { href: "/admin/settings", label: "Settings" },
];

export default function AdminLayout({ title, children, previewHref }) {
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">
      <aside className="w-56 border-r border-white/10 p-4 flex flex-col gap-1 font-mono text-sm">
        <h1 className="text-xs text-zinc-500 mb-4 uppercase tracking-wider">Admin</h1>
        {MENU.map((item) => (
          <Link key={item.href} href={item.href}>
            <a
              className={
                "px-3 py-2 rounded-lg " +
                (router.pathname.startsWith(item.href) ? "bg-white/10 text-white" : "text-zinc-400 hover:bg-white/5")
              }
            >
              {item.label}
            </a>
          </Link>
        ))}
        <button onClick={logout} type="button" className="mt-auto px-3 py-2 rounded-lg text-left text-rose-400 hover:bg-white/5">
          Logout
        </button>
      </aside>
      <main className="flex-1 p-8 pb-24">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">{title}</h2>
          {previewHref && (
            <a
              href={previewHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono px-3 py-1.5 rounded-lg border border-white/10 text-zinc-300 hover:border-brand-400/40"
            >
              Preview ↗
            </a>
          )}
        </div>
        {children}
      </main>
    </div>
  );
}
