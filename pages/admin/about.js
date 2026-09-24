import AdminLayout from "../../components/admin/AdminLayout";
import LocaleTabs from "../../components/admin/LocaleTabs";
import FormField, { TextInput, TextArea } from "../../components/admin/FormField";
import PublishBar from "../../components/admin/PublishBar";
import { useAdminDraft } from "../../components/admin/AdminDraftContext";
import { withAdminSsr } from "../../utils/session";

export const getServerSideProps = withAdminSsr();

export default function AboutAdminPage() {
  const { portfolio, updatePortfolio, loading } = useAdminDraft();

  if (loading || !portfolio) {
    return (
      <AdminLayout title="About">
        <p className="text-zinc-500 text-sm">Memuat...</p>
      </AdminLayout>
    );
  }

  const updateAboutPara = (lang, value) => {
    updatePortfolio((prev) => ({ ...prev, aboutpara: { ...prev.aboutpara, [lang]: value } }));
  };

  return (
    <AdminLayout title="About" previewHref="/">
      <LocaleTabs
        renderEn={() => (
          <FormField label="Teks about (EN)">
            <TextArea value={portfolio.aboutpara.en} onChange={(e) => updateAboutPara("en", e.target.value)} />
          </FormField>
        )}
        renderId={() => (
          <FormField label="Teks about (ID)">
            <TextArea value={portfolio.aboutpara.id} onChange={(e) => updateAboutPara("id", e.target.value)} />
          </FormField>
        )}
      />

      <p className="text-xs text-zinc-500 mt-2">
        Catatan: field info kampus dan info pekerjaan yang terstruktur (`resume.education`, `resume.experiences`) sengaja
        dikosongkan saat migrasi karena datanya template lama yang salah, dan tidak ada halaman publik yang membacanya
        setelah pembersihan dead code di Task 3. Jika nanti dibutuhkan halaman resume terstruktur, field tersebut sudah
        tersedia di <code>data/portfolio.json</code> dan bisa diberi menu admin baru di luar plan ini.
      </p>

      <PublishBar />
    </AdminLayout>
  );
}
