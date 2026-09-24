import { useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import SortableList from "../../components/admin/SortableList";
import FormField, { TextInput, TextArea } from "../../components/admin/FormField";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import PublishBar from "../../components/admin/PublishBar";
import { useAdminDraft } from "../../components/admin/AdminDraftContext";
import { withAdminSsr } from "../../utils/session";

export const getServerSideProps = withAdminSsr();

export default function ServicesAdminPage() {
  const { portfolio, updatePortfolio, loading } = useAdminDraft();
  const [deleteTarget, setDeleteTarget] = useState(null);

  if (loading || !portfolio) {
    return (
      <AdminLayout title="Services">
        <p className="text-zinc-500 text-sm">Memuat...</p>
      </AdminLayout>
    );
  }

  const updateItem = (id, field, lang, value) => {
    updatePortfolio((prev) => ({
      ...prev,
      services: prev.services.map((s) =>
        s.id === id ? { ...s, [field]: { ...s[field], [lang]: value } } : s
      ),
    }));
  };

  const togglePublished = (id) => {
    updatePortfolio((prev) => ({
      ...prev,
      services: prev.services.map((s) => (s.id === id ? { ...s, published: !s.published } : s)),
    }));
  };

  const addItem = () => {
    updatePortfolio((prev) => ({
      ...prev,
      services: [
        ...prev.services,
        { id: String(Date.now()), title: { en: "", id: "" }, description: { en: "", id: "" }, published: true, order: prev.services.length },
      ],
    }));
  };

  const confirmDelete = () => {
    updatePortfolio((prev) => ({ ...prev, services: prev.services.filter((s) => s.id !== deleteTarget) }));
    setDeleteTarget(null);
  };

  const reorder = (reordered) => updatePortfolio((prev) => ({ ...prev, services: reordered }));

  return (
    <AdminLayout title="Services" previewHref="/">
      <SortableList
        items={portfolio.services}
        getId={(s) => s.id}
        onReorder={reorder}
        renderItem={(service) => (
          <div className="border border-white/10 rounded-xl p-4 mb-3">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <FormField label="Title EN"><TextInput value={service.title.en} onChange={(e) => updateItem(service.id, "title", "en", e.target.value)} /></FormField>
              <FormField label="Title ID"><TextInput value={service.title.id} onChange={(e) => updateItem(service.id, "title", "id", e.target.value)} /></FormField>
              <FormField label="Description EN"><TextArea value={service.description.en} onChange={(e) => updateItem(service.id, "description", "en", e.target.value)} /></FormField>
              <FormField label="Description ID"><TextArea value={service.description.id} onChange={(e) => updateItem(service.id, "description", "id", e.target.value)} /></FormField>
            </div>
            <div className="flex items-center justify-between">
              <button
                onClick={() => togglePublished(service.id)}
                type="button"
                className={"text-xs px-3 py-1.5 rounded-lg font-mono " + (service.published ? "bg-brand-400/20 text-brand-300" : "bg-white/5 text-zinc-500")}
              >
                {service.published ? "Published" : "Draft"}
              </button>
              <button onClick={() => setDeleteTarget(service.id)} type="button" className="text-xs text-rose-400 hover:text-rose-300">
                Hapus
              </button>
            </div>
          </div>
        )}
      />

      <button onClick={addItem} type="button" className="mt-3 text-sm px-4 py-2 rounded-lg border border-white/10 text-zinc-300 hover:border-brand-400/40">
        Tambah service +
      </button>

      <ConfirmDialog open={Boolean(deleteTarget)} title="Hapus service?" description="Service ini akan hilang dari halaman utama." onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />

      <PublishBar />
    </AdminLayout>
  );
}
