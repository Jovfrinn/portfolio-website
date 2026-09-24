import { useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import SortableList from "../../components/admin/SortableList";
import FormField, { TextInput, TextArea } from "../../components/admin/FormField";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import PublishBar from "../../components/admin/PublishBar";
import { useAdminDraft } from "../../components/admin/AdminDraftContext";
import { withAdminSsr } from "../../utils/session";

export const getServerSideProps = withAdminSsr();

export default function HowItWorkAdminPage() {
  const { portfolio, updatePortfolio, loading } = useAdminDraft();
  const [deleteTarget, setDeleteTarget] = useState(null);

  if (loading || !portfolio) {
    return (
      <AdminLayout title="How I Work">
        <p className="text-zinc-500 text-sm">Memuat...</p>
      </AdminLayout>
    );
  }

  const updateSectionField = (field, lang, value) => {
    updatePortfolio((prev) => ({ ...prev, howIWork: { ...prev.howIWork, [field]: { ...prev.howIWork[field], [lang]: value } } }));
  };

  const updateStep = (id, field, lang, value) => {
    updatePortfolio((prev) => ({
      ...prev,
      howIWork: {
        ...prev.howIWork,
        steps: prev.howIWork.steps.map((s) => (s.id === id ? { ...s, [field]: { ...s[field], [lang]: value } } : s)),
      },
    }));
  };

  const addStep = () => {
    updatePortfolio((prev) => ({
      ...prev,
      howIWork: {
        ...prev.howIWork,
        steps: [...prev.howIWork.steps, { id: String(Date.now()), title: { en: "", id: "" }, description: { en: "", id: "" }, order: prev.howIWork.steps.length }],
      },
    }));
  };

  const confirmDelete = () => {
    updatePortfolio((prev) => ({ ...prev, howIWork: { ...prev.howIWork, steps: prev.howIWork.steps.filter((s) => s.id !== deleteTarget) } }));
    setDeleteTarget(null);
  };

  const reorder = (reordered) => updatePortfolio((prev) => ({ ...prev, howIWork: { ...prev.howIWork, steps: reordered } }));

  return (
    <AdminLayout title="How I Work" previewHref="/">
      <div className="grid grid-cols-2 gap-3 mb-6">
        <FormField label="Judul EN"><TextInput value={portfolio.howIWork.title.en} onChange={(e) => updateSectionField("title", "en", e.target.value)} /></FormField>
        <FormField label="Judul ID"><TextInput value={portfolio.howIWork.title.id} onChange={(e) => updateSectionField("title", "id", e.target.value)} /></FormField>
        <FormField label="Deskripsi EN"><TextArea value={portfolio.howIWork.description.en} onChange={(e) => updateSectionField("description", "en", e.target.value)} /></FormField>
        <FormField label="Deskripsi ID"><TextArea value={portfolio.howIWork.description.id} onChange={(e) => updateSectionField("description", "id", e.target.value)} /></FormField>
      </div>

      <h3 className="text-sm font-mono text-zinc-400 mb-3">Langkah-langkah (nomor otomatis dari urutan)</h3>
      <SortableList
        items={portfolio.howIWork.steps}
        getId={(step) => step.id}
        onReorder={reorder}
        renderItem={(step, index) => (
          <div className="border border-white/10 rounded-xl p-4 mb-3">
            <p className="text-xs font-mono text-brand-400 mb-2">Step {String(index + 1).padStart(2, "0")}</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <FormField label="Title EN"><TextInput value={step.title.en} onChange={(e) => updateStep(step.id, "title", "en", e.target.value)} /></FormField>
              <FormField label="Title ID"><TextInput value={step.title.id} onChange={(e) => updateStep(step.id, "title", "id", e.target.value)} /></FormField>
              <FormField label="Description EN"><TextArea value={step.description.en} onChange={(e) => updateStep(step.id, "description", "en", e.target.value)} /></FormField>
              <FormField label="Description ID"><TextArea value={step.description.id} onChange={(e) => updateStep(step.id, "description", "id", e.target.value)} /></FormField>
            </div>
            <button onClick={() => setDeleteTarget(step.id)} type="button" className="text-xs text-rose-400 hover:text-rose-300">
              Hapus
            </button>
          </div>
        )}
      />

      <button onClick={addStep} type="button" className="mt-3 text-sm px-4 py-2 rounded-lg border border-white/10 text-zinc-300 hover:border-brand-400/40">
        Tambah step +
      </button>

      <ConfirmDialog open={Boolean(deleteTarget)} title="Hapus step?" description="Step ini akan hilang dari section How I Work." onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />

      <PublishBar />
    </AdminLayout>
  );
}
