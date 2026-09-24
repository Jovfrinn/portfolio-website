import AdminLayout from "../../components/admin/AdminLayout";
import LocaleTabs from "../../components/admin/LocaleTabs";
import FormField, { TextInput, TextArea } from "../../components/admin/FormField";
import PublishBar from "../../components/admin/PublishBar";
import { useAdminDraft } from "../../components/admin/AdminDraftContext";
import { withAdminSsr } from "../../utils/session";

export const getServerSideProps = withAdminSsr();

export default function CtaAdminPage() {
  const { portfolio, updatePortfolio, loading } = useAdminDraft();

  if (loading || !portfolio) {
    return (
      <AdminLayout title="CTA">
        <p className="text-zinc-500 text-sm">Memuat...</p>
      </AdminLayout>
    );
  }

  const updateField = (field, lang, value) => {
    updatePortfolio((prev) => ({ ...prev, footerCta: { ...prev.footerCta, [field]: { ...prev.footerCta[field], [lang]: value } } }));
  };

  return (
    <AdminLayout title="CTA" previewHref="/">
      <LocaleTabs
        renderEn={() => (
          <>
            <FormField label="Judul"><TextInput value={portfolio.footerCta.title.en} onChange={(e) => updateField("title", "en", e.target.value)} /></FormField>
            <FormField label="Deskripsi"><TextArea value={portfolio.footerCta.description.en} onChange={(e) => updateField("description", "en", e.target.value)} /></FormField>
            <FormField label="Label tombol Email"><TextInput value={portfolio.footerCta.emailButtonLabel.en} onChange={(e) => updateField("emailButtonLabel", "en", e.target.value)} /></FormField>
          </>
        )}
        renderId={() => (
          <>
            <FormField label="Judul"><TextInput value={portfolio.footerCta.title.id} onChange={(e) => updateField("title", "id", e.target.value)} /></FormField>
            <FormField label="Deskripsi"><TextArea value={portfolio.footerCta.description.id} onChange={(e) => updateField("description", "id", e.target.value)} /></FormField>
            <FormField label="Label tombol Email"><TextInput value={portfolio.footerCta.emailButtonLabel.id} onChange={(e) => updateField("emailButtonLabel", "id", e.target.value)} /></FormField>
          </>
        )}
      />

      <p className="text-xs text-zinc-500 mt-2">
        Tombol FastWork dan Projects.co.id yang tampil di sebelah tombol Email diatur di menu Contact & Social
        (placement &quot;Tampil di tombol Footer CTA&quot;), bukan di sini.
      </p>

      <PublishBar />
    </AdminLayout>
  );
}
