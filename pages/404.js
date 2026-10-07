import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useLanguage } from "../context/LanguageContext";

export default function Custom404() {
  const { lang } = useLanguage();
  return (
    <div className="min-h-screen flex flex-col bg-[#f1e4d0] text-[#1f2a37]">
      <div className="bg-[#f8f3e8] border-b border-[#ebdccb]">
        <Header />
      </div>
      <div className="content-container flex-1 flex flex-col items-center justify-center text-center py-24">
        <span className="font-kalam font-bold text-5xl text-[#2f5d56] mb-2">
          404
        </span>
        <h1 className="font-nunito text-3xl tablet:text-4xl font-extrabold text-[#1f2a37] mb-4">
          {lang === "en" ? "Page not found" : "Halaman tidak ditemukan"}
        </h1>
        <p className="font-raleway font-medium text-[#4b5563] mb-8 max-w-md">
          {lang === "en"
            ? "The page you are looking for does not exist or the project is not published yet."
            : "Halaman yang kamu cari tidak ada atau project belum dipublish."}
        </p>
        <Link href="/">
          <a className="text-sm px-6 py-3 rounded-full font-raleway font-bold bg-[#2f5d56] text-white hover:bg-[#244943] transition-all shadow-md">
            {lang === "en" ? "Back to home" : "Kembali ke beranda"}
          </a>
        </Link>
      </div>
      <Footer />
    </div>
  );
}
