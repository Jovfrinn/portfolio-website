import { useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import SortableList from "../../components/admin/SortableList";
import FormField, { TextInput } from "../../components/admin/FormField";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import PublishBar from "../../components/admin/PublishBar";
import { useAdminDraft } from "../../components/admin/AdminDraftContext";
import { withAdminSsr } from "../../utils/session";

export const getServerSideProps = withAdminSsr();

const STATUS_OPTIONS = [
  { value: "active", label: "Active / Aktif" },
  { value: "in_progress", label: "In Progress / Sedang Berjalan" },
  { value: "open", label: "Open / Terbuka" },
];

export default function StatusCardAdminPage() {
  const { portfolio, updatePortfolio, loading } = useAdminDraft();
  const [deleteTarget, setDeleteTarget] = useState(null);

  if (loading || !portfolio) {
    return (
      <AdminLayout title="Status Card">
        <p className="text-zinc-500 text-sm">Memuat...</p>
      </AdminLayout>
    );
  }

  const updateItem = (id, field, value) => {
    updatePortfolio((prev) => ({
      ...prev,
      statusCard: prev.statusCard.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    }));
  };

  const addItem = () => {
    const newId = String(Date.now());
    updatePortfolio((prev) => ({
      ...prev,
      statusCard: [...prev.statusCard, { id: newId, labelEn: "New item", labelId: "Item baru", status: "open" }],
    }));
  };

  const confirmDelete = () => {
    updatePortfolio((prev) => ({ ...prev, statusCard: prev.statusCard.filter((item) => item.id !== deleteTarget) }));
    setDeleteTarget(null);
  };

  const reorder = (reordered) => updatePortfolio((prev) => ({ ...prev, statusCard: reordered }));

  return (
    <AdminLayout title="Status Card" previewHref="/">
      <SortableList
        items={portfolio.statusCard}
        getId={(item) => item.id}
        onReorder={reorder}
        renderItem={(item) => (
          <div className="border border-white/10 rounded-xl p-4 mb-3">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <FormField label="Label EN">
                <TextInput value={item.labelEn} onChange={(e) => updateItem(item.id, "labelEn", e.target.value)} />
              </FormField>
              <FormField label="Label ID">
                <TextInput value={item.labelId} onChange={(e) => updateItem(item.id, "labelId", e.target.value)} />
              </FormField>
            </div>
            <div className="flex items-center justify-between">
              <select
                value={item.status}
                onChange={(e) => updateItem(item.id, "status", e.target.value)}
                className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <button onClick={() => setDeleteTarget(item.id)} type="button" className="text-xs text-rose-400 hover:text-rose-300">
                Hapus
              </button>
            </div>
          </div>
        )}
      />

      <button onClick={addItem} type="button" className="mt-3 text-sm px-4 py-2 rounded-lg border border-white/10 text-zinc-300 hover:border-brand-400/40">
        Tambah item +
      </button>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus item status?"
        description="Item ini akan dihapus dari status card di halaman utama."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <PublishBar />
    </AdminLayout>
  );
}
