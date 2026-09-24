import { useRef, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import LocaleTabs from "../../components/admin/LocaleTabs";
import FormField, { TextInput, TextArea } from "../../components/admin/FormField";
import ImageUploadField from "../../components/admin/ImageUploadField";
import PublishBar from "../../components/admin/PublishBar";
import { useAdminDraft } from "../../components/admin/AdminDraftContext";
import { publicUrlToRepoPath } from "../../utils/imageProcessing";
import { withAdminSsr } from "../../utils/session";

export const getServerSideProps = withAdminSsr();

function PdfUploadField({ label, value, targetUrl, onUploaded, onRemoved }) {
  const inputRef = useRef(null);
  const [error, setError] = useState(null);
  const { addPendingUpload, addPendingDelete } = useAdminDraft();

  const handleFile = async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setError("File harus berupa PDF.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Ukuran file maksimal 10MB.");
      return;
    }
    setError(null);
    addPendingUpload(publicUrlToRepoPath(targetUrl), file);
    onUploaded(targetUrl);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleRemove = () => {
    if (value) addPendingDelete(publicUrlToRepoPath(value));
    onRemoved();
  };

  return (
    <FormField label={label}>
      <div className="flex items-center gap-3">
        {value ? (
          <>
            <a href={value} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-400 underline">
              Lihat file saat ini
            </a>
            <button onClick={handleRemove} type="button" className="text-xs text-rose-400 hover:text-rose-300">
              Hapus
            </button>
          </>
        ) : (
          <span className="text-xs text-zinc-500">Belum ada file</span>
        )}
        <label className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-zinc-300 hover:border-brand-400/40 cursor-pointer">
          Upload PDF
          <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={handleFile} />
        </label>
      </div>
      {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
    </FormField>
  );
}

export default function SettingsAdminPage() {
  const { portfolio, updatePortfolio, loading } = useAdminDraft();

  if (loading || !portfolio) {
    return (
      <AdminLayout title="Settings">
        <p className="text-zinc-500 text-sm">Memuat...</p>
      </AdminLayout>
    );
  }

  const updateSeo = (field, value) => {
    updatePortfolio((prev) => ({ ...prev, seo: { ...prev.seo, [field]: value } }));
  };

  const updateResumeFile = (lang, url) => {
    updatePortfolio((prev) => ({ ...prev, resumeFiles: { ...prev.resumeFiles, [lang]: url } }));
  };

  const updateFooterText = (value) => {
    updatePortfolio((prev) => ({ ...prev, footerCopyrightText: value }));
  };

  const updateShowCursor = (value) => {
    updatePortfolio((prev) => ({ ...prev, flags: { ...prev.flags, showCursor: value } }));
  };

  return (
    <AdminLayout title="Settings" previewHref="/">
      <h3 className="text-sm font-mono text-zinc-400 mb-3">SEO Global</h3>
      <LocaleTabs
        renderEn={() => (
          <>
            <FormField label="SEO title"><TextInput value={portfolio.seo.titleEn} onChange={(e) => updateSeo("titleEn", e.target.value)} /></FormField>
            <FormField label="SEO description"><TextArea value={portfolio.seo.descriptionEn} onChange={(e) => updateSeo("descriptionEn", e.target.value)} /></FormField>
          </>
        )}
        renderId={() => (
          <>
            <FormField label="SEO title"><TextInput value={portfolio.seo.titleId} onChange={(e) => updateSeo("titleId", e.target.value)} /></FormField>
            <FormField label="SEO description"><TextArea value={portfolio.seo.descriptionId} onChange={(e) => updateSeo("descriptionId", e.target.value)} /></FormField>
          </>
        )}
      />
      <FormField label="Keywords (pisahkan dengan koma)">
        <TextInput value={portfolio.seo.keywords} onChange={(e) => updateSeo("keywords", e.target.value)} />
      </FormField>
      <FormField label="Canonical URL">
        <TextInput value={portfolio.seo.canonicalUrl} onChange={(e) => updateSeo("canonicalUrl", e.target.value)} />
      </FormField>

      <h3 className="text-sm font-mono text-zinc-400 mt-8 mb-3">Favicon & OG Image</h3>
      <div className="grid grid-cols-2 gap-6">
        <ImageUploadField
          label="Favicon"
          value={portfolio.seo.faviconUrl}
          publicUrlThumb="/favicon-thumb.webp"
          publicUrlFull="/favicon.webp"
          onUploaded={(thumbUrl, fullUrl) => updateSeo("faviconUrl", fullUrl)}
          onRemoved={() => updateSeo("faviconUrl", null)}
        />
        <ImageUploadField
          label="OG Image (default homepage)"
          value={portfolio.seo.ogImage}
          publicUrlThumb="/og-image-thumb.webp"
          publicUrlFull="/og-image.webp"
          onUploaded={(thumbUrl, fullUrl) => updateSeo("ogImage", fullUrl)}
          onRemoved={() => updateSeo("ogImage", null)}
        />
      </div>
      <p className="text-xs text-zinc-500 mt-2">
        Favicon dan OG Image sama-sama disimpan sebagai versi penuh (bukan thumbnail) karena keduanya perlu resolusi
        yang cukup untuk ditampilkan oleh browser tab dan preview link sosial media.
      </p>

      <h3 className="text-sm font-mono text-zinc-400 mt-8 mb-3">Resume PDF</h3>
      <PdfUploadField
        label="Resume (EN)"
        value={portfolio.resumeFiles.en}
        targetUrl="/images/Resume-(English).pdf"
        onUploaded={(url) => updateResumeFile("en", url)}
        onRemoved={() => updateResumeFile("en", null)}
      />
      <PdfUploadField
        label="Resume (ID)"
        value={portfolio.resumeFiles.id}
        targetUrl="/images/Resume-(Indonesia).pdf"
        onUploaded={(url) => updateResumeFile("id", url)}
        onRemoved={() => updateResumeFile("id", null)}
      />

      <h3 className="text-sm font-mono text-zinc-400 mt-8 mb-3">Lain-lain</h3>
      <FormField label="Teks footer (copyright)">
        <TextInput value={portfolio.footerCopyrightText} onChange={(e) => updateFooterText(e.target.value)} />
      </FormField>
      <label className="flex items-center gap-2 text-sm text-zinc-300 mt-2">
        <input type="checkbox" checked={portfolio.flags.showCursor} onChange={(e) => updateShowCursor(e.target.checked)} />
        Custom cursor aktif
      </label>

      <PublishBar />
    </AdminLayout>
  );
}
