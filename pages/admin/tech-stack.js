import { useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import SortableList from "../../components/admin/SortableList";
import FormField, { TextInput } from "../../components/admin/FormField";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import PublishBar from "../../components/admin/PublishBar";
import { useAdminDraft } from "../../components/admin/AdminDraftContext";
import { withAdminSsr } from "../../utils/session";

export const getServerSideProps = withAdminSsr();

export default function TechStackAdminPage() {
  const { portfolio, updatePortfolio, loading } = useAdminDraft();
  const [deleteTarget, setDeleteTarget] = useState(null);

  if (loading || !portfolio) {
    return (
      <AdminLayout title="Tech Stack">
        <p className="text-zinc-500 text-sm">Memuat...</p>
      </AdminLayout>
    );
  }

  const updateCategoryName = (categoryId, lang, value) => {
    updatePortfolio((prev) => ({
      ...prev,
      techstack: {
        ...prev.techstack,
        categories: prev.techstack.categories.map((cat) =>
          cat.id === categoryId ? { ...cat, name: { ...cat.name, [lang]: value } } : cat
        ),
      },
    }));
  };

  const reorderCategories = (reordered) => {
    updatePortfolio((prev) => ({ ...prev, techstack: { ...prev.techstack, categories: reordered } }));
  };

  const addCategory = () => {
    updatePortfolio((prev) => ({
      ...prev,
      techstack: {
        ...prev.techstack,
        categories: [
          ...prev.techstack.categories,
          { id: String(Date.now()), name: { en: "", id: "" }, order: prev.techstack.categories.length, items: [] },
        ],
      },
    }));
  };

  const updateItem = (categoryId, itemId, field, value) => {
    updatePortfolio((prev) => ({
      ...prev,
      techstack: {
        ...prev.techstack,
        categories: prev.techstack.categories.map((cat) =>
          cat.id === categoryId
            ? { ...cat, items: cat.items.map((item) => (item.id === itemId ? { ...item, [field]: value } : item)) }
            : cat
        ),
      },
    }));
  };

  const addItem = (categoryId) => {
    updatePortfolio((prev) => ({
      ...prev,
      techstack: {
        ...prev.techstack,
        categories: prev.techstack.categories.map((cat) =>
          cat.id === categoryId
            ? { ...cat, items: [...cat.items, { id: String(Date.now()), name: "", level: "familiar" }] }
            : cat
        ),
      },
    }));
  };

  const confirmDeleteItem = () => {
    updatePortfolio((prev) => ({
      ...prev,
      techstack: {
        ...prev.techstack,
        categories: prev.techstack.categories.map((cat) => ({
          ...cat,
          items: cat.items.filter((item) => item.id !== deleteTarget),
        })),
      },
    }));
    setDeleteTarget(null);
  };

  return (
    <AdminLayout title="Tech Stack" previewHref="/">
      <SortableList
        items={portfolio.techstack.categories}
        getId={(cat) => cat.id}
        onReorder={reorderCategories}
        renderItem={(category) => (
          <div className="border border-white/10 rounded-xl p-4 mb-3">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <FormField label="Nama kategori EN">
                <TextInput value={category.name.en} onChange={(e) => updateCategoryName(category.id, "en", e.target.value)} />
              </FormField>
              <FormField label="Nama kategori ID">
                <TextInput value={category.name.id} onChange={(e) => updateCategoryName(category.id, "id", e.target.value)} />
              </FormField>
            </div>

            {category.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 mb-2">
                <TextInput
                  value={item.name}
                  onChange={(e) => updateItem(category.id, item.id, "name", e.target.value)}
                  className="flex-1"
                />
                <select
                  value={item.level}
                  onChange={(e) => updateItem(category.id, item.id, "level", e.target.value)}
                  className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white"
                >
                  <option value="main">Main</option>
                  <option value="familiar">Familiar</option>
                </select>
                <button onClick={() => setDeleteTarget(item.id)} type="button" className="text-xs text-rose-400 hover:text-rose-300">
                  Hapus
                </button>
              </div>
            ))}

            <button onClick={() => addItem(category.id)} type="button" className="mt-2 text-xs text-zinc-400 hover:text-white">
              + Tambah item
            </button>
          </div>
        )}
      />

      <button onClick={addCategory} type="button" className="mt-3 text-sm px-4 py-2 rounded-lg border border-white/10 text-zinc-300 hover:border-brand-400/40">
        Tambah kategori +
      </button>

      <ConfirmDialog open={Boolean(deleteTarget)} title="Hapus item tech stack?" description="Item ini akan hilang dari section Tech Stack." onConfirm={confirmDeleteItem} onCancel={() => setDeleteTarget(null)} />

      <PublishBar />
    </AdminLayout>
  );
}
