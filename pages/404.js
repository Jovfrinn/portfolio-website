import Link from "next/link";
import Header from "../components/Header";
import { useLanguage } from "../context/LanguageContext";

export default function Custom404() {
  const { lang } = useLanguage();
  return (
    <div className="min-h-screen">
      <Header />
      <div className="container mx-auto px-8 flex flex-col items-center justify-center text-center min-h-[70vh]">
        <p className="font-mono text-brand-400 text-sm mb-4">404</p>
        <h1 className="font-display text-3xl tablet:text-4xl font-black text-white mb-4">
          {lang === "en" ? "Page not found" : "Halaman tidak ditemukan"}
        </h1>
        <p className="text-zinc-400 mb-8 max-w-md">
          {lang === "en"
            ? "The page you are looking for does not exist or the project is not published yet."
            : "Halaman yang kamu cari tidak ada atau project belum dipublish."}
        </p>
        <Link href="/">
          <a className="text-sm px-6 py-3 rounded-full font-mono font-bold bg-brand-400 text-zinc-950 hover:bg-brand-300 transition-all">
            {lang === "en" ? "Back to home" : "Kembali ke beranda"}
          </a>
        </Link>
      </div>
    </div>
  );
}
