import { useState } from "react";
import { useRouter } from "next/router";
import AdminLayout from "../../../components/admin/AdminLayout";
import SortableList from "../../../components/admin/SortableList";
import ConfirmDialog from "../../../components/admin/ConfirmDialog";
import PublishBar from "../../../components/admin/PublishBar";
import { useAdminDraft } from "../../../components/admin/AdminDraftContext";
import { publicUrlToRepoPath } from "../../../utils/imageProcessing";
import { withAdminSsr } from "../../../utils/session";

export const getServerSideProps = withAdminSsr();

export default function ProjectsListAdminPage() {
  const { portfolio, updatePortfolio, loading, addPendingDelete } = useAdminDraft();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const router = useRouter();

  if (loading || !portfolio) {
    return (
      <AdminLayout title="Projects">
        <p className="text-zinc-500 text-sm">Memuat...</p>
      </AdminLayout>
    );
  }

  const reorder = (reordered) => updatePortfolio((prev) => ({ ...prev, projects: reordered }));

  const togglePublished = (id) => {
    updatePortfolio((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => (p.id === id ? { ...p, published: !p.published } : p)),
    }));
  };

  const confirmDelete = () => {
    const project = portfolio.projects.find((p) => p.id === deleteTarget);
    if (project) {
      // portfolio.json only ever stores public URLs (e.g. /images/projects/x/cover.webp);
      // addPendingDelete stages repo-relative paths for utils/github.js and utils/localPublish.js,
      // so every URL is converted through publicUrlToRepoPath right before staging.
      if (project.thumbnail) addPendingDelete(publicUrlToRepoPath(project.thumbnail));
      if (project.thumbnailThumb) addPendingDelete(publicUrlToRepoPath(project.thumbnailThumb));
      project.gallery.forEach((image) => {
        if (image.src) addPendingDelete(publicUrlToRepoPath(image.src));
        if (image.thumbSrc) addPendingDelete(publicUrlToRepoPath(image.thumbSrc));
      });
    }
    updatePortfolio((prev) => ({ ...prev, projects: prev.projects.filter((p) => p.id !== deleteTarget) }));
    setDeleteTarget(null);
  };

  return (
    <AdminLayout title="Projects">
      <button
        onClick={() => router.push("/admin/projects/new")}
        type="button"
        className="mb-6 text-sm px-4 py-2 rounded-lg bg-brand-400 text-zinc-950 font-bold"
      >
        Tambah project +
      </button>

      <SortableList
        items={portfolio.projects}
        getId={(project) => project.id}
        onReorder={reorder}
        renderItem={(project) => (
          <div className="border border-white/10 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-white font-bold">{project.title.en}</p>
              <p className="text-xs text-zinc-500 font-mono">/projects/{project.slug}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => togglePublished(project.id)}
                type="button"
                className={
                  "text-xs px-3 py-1.5 rounded-lg font-mono " +
                  (project.published ? "bg-brand-400/20 text-brand-300" : "bg-white/5 text-zinc-500")
                }
              >
                {project.published ? "Published" : "Draft"}
              </button>
              <a
                href={"/projects/" + project.slug}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-zinc-400 hover:text-white"
              >
                Preview
              </a>
              <button
                onClick={() => router.push("/admin/projects/" + project.id)}
                type="button"
                className="text-xs text-zinc-300 hover:text-white"
              >
                Edit
              </button>
              <button onClick={() => setDeleteTarget(project.id)} type="button" className="text-xs text-rose-400 hover:text-rose-300">
                Hapus
              </button>
            </div>
          </div>
        )}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus project?"
        description="Project dan semua gambar galerinya akan dihapus saat publish berikutnya."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <PublishBar />
    </AdminLayout>
  );
}
