import { useState } from "react";
import { useRouter } from "next/router";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const contentType = res.headers.get("content-type") || "";
      let json = {};
      if (contentType.includes("application/json")) {
        try {
          json = await res.json();
        } catch (_) {
          json = {};
        }
      }

      if (!res.ok) {
        if (res.status === 429) {
          setError(
            "Terlalu banyak percobaan. Coba lagi dalam " +
              (json.retryAfterSeconds || 60) +
              " detik."
          );
        } else if (res.status === 500 && json.error === "admin_not_configured") {
          setError(
            "Admin belum dikonfigurasi. Pastikan ADMIN_EMAIL dan ADMIN_PASSWORD_HASH sudah diisi di Vercel Environment Variables dan sudah di-Redeploy."
          );
        } else if (res.status === 500) {
          setError(
            "Terjadi kesalahan server (500). Pastikan Environment Variables di Vercel sudah lengkap dan lakukan Redeploy."
          );
        } else {
          setError("Email atau password salah.");
        }
        return;
      }
      router.push("/admin");
    } catch (err) {
      setError("Gagal terhubung ke server: " + err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm border border-white/10 rounded-2xl p-8 bg-white/[0.02]"
      >
        <h1 className="text-lg font-bold text-white mb-6 font-mono">
          Admin Login
        </h1>
        <div className="mb-4">
          <label className="block text-xs font-mono text-zinc-500 mb-1.5">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-brand-400/60"
          />
        </div>
        <div className="mb-6">
          <label className="block text-xs font-mono text-zinc-500 mb-1.5">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-brand-400/60"
          />
        </div>
        {error && (
          <p className="text-xs text-rose-400 mb-4 leading-relaxed">{error}</p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="w-full py-2.5 rounded-full font-mono font-bold bg-brand-400 text-zinc-950 disabled:opacity-40"
        >
          {busy ? "Memproses..." : "Login"}
        </button>
      </form>
    </div>
  );
}
