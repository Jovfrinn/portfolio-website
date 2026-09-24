import { useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import SortableList from "../../components/admin/SortableList";
import FormField, { TextInput } from "../../components/admin/FormField";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import PublishBar from "../../components/admin/PublishBar";
import { useAdminDraft } from "../../components/admin/AdminDraftContext";
import { withAdminSsr } from "../../utils/session";

export const getServerSideProps = withAdminSsr();

export default function ContactSocialAdminPage() {
  const { portfolio, updatePortfolio, loading } = useAdminDraft();
  const [deleteTarget, setDeleteTarget] = useState(null);

  if (loading || !portfolio) {
    return (
      <AdminLayout title="Contact & Social">
        <p className="text-zinc-500 text-sm">Memuat...</p>
      </AdminLayout>
    );
  }

  const updateField = (id, field, value) => {
    updatePortfolio((prev) => ({
      ...prev,
      socials: prev.socials.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    }));
  };

  const togglePublished = (id) => {
    updatePortfolio((prev) => ({
      ...prev,
      socials: prev.socials.map((s) => (s.id === id ? { ...s, published: !s.published } : s)),
    }));
  };

  const addItem = () => {
    updatePortfolio((prev) => ({
      ...prev,
      socials: [
        ...prev.socials,
        {
          id: String(Date.now()), title: "New Platform", link: "", actionEn: "", actionId: "",
          placement: "connect_grid", published: true, order: prev.socials.length,
        },
      ],
    }));
  };

  const confirmDelete = () => {
    updatePortfolio((prev) => ({ ...prev, socials: prev.socials.filter((s) => s.id !== deleteTarget) }));
    setDeleteTarget(null);
  };

  const reorder = (reordered) => updatePortfolio((prev) => ({ ...prev, socials: reordered }));

  return (
    <AdminLayout title="Contact & Social" previewHref="/">
      <SortableList
        items={portfolio.socials}
        getId={(s) => s.id}
        onReorder={reorder}
        renderItem={(social) => (
          <div className="border border-white/10 rounded-xl p-4 mb-3">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <FormField label="Platform / Label"><TextInput value={social.title} onChange={(e) => updateField(social.id, "title", e.target.value)} /></FormField>
              <FormField label="URL"><TextInput value={social.link} onChange={(e) => updateField(social.id, "link", e.target.value)} /></FormField>
              <FormField label="Action text EN (muncul di bawah icon, khusus Connect Grid)"><TextInput value={social.actionEn} onChange={(e) => updateField(social.id, "actionEn", e.target.value)} /></FormField>
              <FormField label="Action text ID"><TextInput value={social.actionId} onChange={(e) => updateField(social.id, "actionId", e.target.value)} /></FormField>
            </div>
            <div className="flex items-center justify-between">
              <select
                value={social.placement}
                onChange={(e) => updateField(social.id, "placement", e.target.value)}
                className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white"
              >
                <option value="connect_grid">Tampil di grid &quot;Let&apos;s Connect&quot;</option>
                <option value="footer_cta">Tampil di tombol Footer CTA</option>
              </select>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => togglePublished(social.id)}
                  type="button"
                  className={"text-xs px-3 py-1.5 rounded-lg font-mono " + (social.published ? "bg-brand-400/20 text-brand-300" : "bg-white/5 text-zinc-500")}
                >
                  {social.published ? "Tampil" : "Disembunyikan"}
                </button>
                <button onClick={() => setDeleteTarget(social.id)} type="button" className="text-xs text-rose-400 hover:text-rose-300">
                  Hapus
                </button>
              </div>
            </div>
          </div>
        )}
      />

      <button onClick={addItem} type="button" className="mt-3 text-sm px-4 py-2 rounded-lg border border-white/10 text-zinc-300 hover:border-brand-400/40">
        Tambah platform +
      </button>

      <ConfirmDialog open={Boolean(deleteTarget)} title="Hapus platform?" description="Link ini akan hilang dari halaman utama." onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />

      <PublishBar />
    </AdminLayout>
  );
}
