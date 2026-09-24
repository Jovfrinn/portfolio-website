import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AdminLayout from "../../../components/admin/AdminLayout";
import LocaleTabs from "../../../components/admin/LocaleTabs";
import FormField, { TextInput, TextArea } from "../../../components/admin/FormField";
import SortableList from "../../../components/admin/SortableList";
import ImageUploadField from "../../../components/admin/ImageUploadField";
import PublishBar from "../../../components/admin/PublishBar";
import { useAdminDraft } from "../../../components/admin/AdminDraftContext";
import { withAdminSsr } from "../../../utils/session";

export const getServerSideProps = withAdminSsr();

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function emptyProject(id) {
  return {
    id, slug: "", path: "", title: { en: "", id: "" }, description: { en: "", id: "" },
    thumbnail: null, thumbnailThumb: null, gallery: [],
    role: { en: "", id: "" }, duration: "", problem: { en: "", id: "" }, solution: { en: "", id: "" },
    features: { en: [], id: [] }, impact: { en: [], id: [] }, tags: [],
    link: [], featured: false, published: false, order: 999,
  };
}

export default function ProjectEditAdminPage() {
  const router = useRouter();
  const { id } = router.query;
  const { portfolio, updatePortfolio, loading } = useAdminDraft();
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugChangedAfterImages, setSlugChangedAfterImages] = useState(false);

  const isNew = id === "new";
  const existing = !loading && portfolio && !isNew ? portfolio.projects.find((p) => p.id === id) : null;

  // Side effect belongs in useEffect, not the render body: creating the draft project
  // and redirecting is a one-time action gated on isNew + not-yet-created, never something
  // that should run (or re-run) purely because this component happened to render again.
  useEffect(() => {
    if (!loading && portfolio && isNew && !portfolio.__draftNewProjectId) {
      const newId = String(Date.now());
      updatePortfolio((prev) => ({
        ...prev,
        __draftNewProjectId: newId,
        projects: [...prev.projects, emptyProject(newId)],
      }));
      router.replace("/admin/projects/" + newId);
    }
  }, [loading, portfolio, isNew, updatePortfolio, router]);

  if (loading || !portfolio || !id) {
    return (
      <AdminLayout title="Project">
        <p className="text-zinc-500 text-sm">Memuat...</p>
      </AdminLayout>
    );
  }

  if (!isNew && !existing) {
    return (
      <AdminLayout title="Project">
        <p className="text-rose-400 text-sm">Project tidak ditemukan.</p>
      </AdminLayout>
    );
  }

  const project = existing || (portfolio.__draftNewProjectId && portfolio.projects.find((p) => p.id === portfolio.__draftNewProjectId));
  if (!project) {
    return (
      <AdminLayout title="Project">
        <p className="text-zinc-500 text-sm">Menyiapkan project baru...</p>
      </AdminLayout>
    );
  }

  const hasImages = Boolean(project.thumbnail) || project.gallery.length > 0;
  const slugMissing = project.slug.trim() === "";

  const updateField = (field, value) => {
    updatePortfolio((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => (p.id === project.id ? { ...p, [field]: value } : p)),
    }));
  };

  const updateBilingualField = (field, lang, value) => {
    updatePortfolio((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => (p.id === project.id ? { ...p, [field]: { ...p[field], [lang]: value } } : p)),
    }));
  };

  const updateListField = (field, lang, value) => {
    const items = value.split("\n").map((s) => s.trim()).filter(Boolean);
    updateBilingualField(field, lang, items);
  };

  const updateTitle = (lang, value) => {
    updateBilingualField("title", lang, value);
    if (lang === "en" && !slugTouched) {
      updateField("slug", slugify(value));
    }
  };

  const updateSlug = (value) => {
    setSlugTouched(true);
    if (hasImages && value !== project.slug) {
      setSlugChangedAfterImages(true);
    }
    updateField("slug", value);
  };

  const updateLink = (index, field, value) => {
    const links = project.link.map((l, i) => (i === index ? { ...l, [field]: value } : l));
    updateField("link", links);
  };

  const setLinkAt = (label, url) => {
    const existingIndex = project.link.findIndex((l) => l.label === label);
    if (existingIndex === -1) {
      if (url) updateField("link", [...project.link, { label, url }]);
      return;
    }
    if (!url) {
      updateField("link", project.link.filter((_, i) => i !== existingIndex));
      return;
    }
    updateLink(existingIndex, "url", url);
  };

  const getLinkValue = (label) => {
    const found = project.link.find((l) => l.label === label);
    return found ? found.url : "";
  };

  const thumbUrlThumb = "/images/projects/" + project.slug + "/cover-thumb.webp";
  const thumbUrlFull = "/images/projects/" + project.slug + "/cover.webp";

  const addGalleryPlaceholder = () => {
    const newImage = {
      id: "img-" + Date.now(),
      src: null,
      thumbSrc: null,
      captionEn: "",
      captionId: "",
      order: project.gallery.length,
    };
    updateField("gallery", [...project.gallery, newImage]);
  };

  const updateGalleryImageUrls = (imageId, thumbUrl, fullUrl) => {
    updateField(
      "gallery",
      project.gallery.map((img) => (img.id === imageId ? { ...img, thumbSrc: thumbUrl, src: fullUrl } : img))
    );
  };

  const updateGalleryCaption = (imageId, lang, value) => {
    const field = lang === "en" ? "captionEn" : "captionId";
    updateField(
      "gallery",
      project.gallery.map((img) => (img.id === imageId ? { ...img, [field]: value } : img))
    );
  };

  const removeGalleryItem = (imageId) => {
    updateField("gallery", project.gallery.filter((img) => img.id !== imageId));
  };

  const reorderGallery = (reordered) => updateField("gallery", reordered);

  return (
    <AdminLayout title={isNew ? "Project baru" : project.title.en || "Project"} previewHref={project.published ? "/projects/" + project.slug : undefined}>
      <FormField label="Slug (URL, bisa diedit manual)">
        <TextInput value={project.slug} onChange={(e) => updateSlug(e.target.value)} />
      </FormField>
      {slugChangedAfterImages && (
        <p className="text-xs text-amber-400 mb-4">
          Slug diubah setelah project sudah punya gambar. Gambar yang sudah diupload sebelumnya mengacu ke path slug
          lama dan bisa jadi broken link setelah publish. Hapus dan upload ulang thumbnail/galeri sekarang slug sudah
          final.
        </p>
      )}

      <LocaleTabs
        renderEn={() => (
          <>
            <FormField label="Title"><TextInput value={project.title.en} onChange={(e) => updateTitle("en", e.target.value)} /></FormField>
            <FormField label="Short description"><TextArea value={project.description.en} onChange={(e) => updateBilingualField("description", "en", e.target.value)} /></FormField>
            <FormField label="Role saya"><TextInput value={project.role.en} onChange={(e) => updateBilingualField("role", "en", e.target.value)} /></FormField>
            <FormField label="Problem"><TextArea value={project.problem.en} onChange={(e) => updateBilingualField("problem", "en", e.target.value)} /></FormField>
            <FormField label="Solution"><TextArea value={project.solution.en} onChange={(e) => updateBilingualField("solution", "en", e.target.value)} /></FormField>
            <FormField label="Key features (satu per baris)"><TextArea value={project.features.en.join("\n")} onChange={(e) => updateListField("features", "en", e.target.value)} /></FormField>
            <FormField label="Impact (1-3 poin, satu per baris)"><TextArea value={project.impact.en.join("\n")} onChange={(e) => updateListField("impact", "en", e.target.value)} /></FormField>
          </>
        )}
        renderId={() => (
          <>
            <FormField label="Title"><TextInput value={project.title.id} onChange={(e) => updateTitle("id", e.target.value)} /></FormField>
            <FormField label="Deskripsi singkat"><TextArea value={project.description.id} onChange={(e) => updateBilingualField("description", "id", e.target.value)} /></FormField>
            <FormField label="Role saya"><TextInput value={project.role.id} onChange={(e) => updateBilingualField("role", "id", e.target.value)} /></FormField>
            <FormField label="Problem"><TextArea value={project.problem.id} onChange={(e) => updateBilingualField("problem", "id", e.target.value)} /></FormField>
            <FormField label="Solution"><TextArea value={project.solution.id} onChange={(e) => updateBilingualField("solution", "id", e.target.value)} /></FormField>
            <FormField label="Key features (satu per baris)"><TextArea value={project.features.id.join("\n")} onChange={(e) => updateListField("features", "id", e.target.value)} /></FormField>
            <FormField label="Impact (1-3 poin, satu per baris)"><TextArea value={project.impact.id.join("\n")} onChange={(e) => updateListField("impact", "id", e.target.value)} /></FormField>
          </>
        )}
      />

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Durasi / tahun"><TextInput value={project.duration} onChange={(e) => updateField("duration", e.target.value)} /></FormField>
        <FormField label="Path label (opsional, cth: ~/mysales)"><TextInput value={project.path} onChange={(e) => updateField("path", e.target.value)} /></FormField>
      </div>

      <FormField label="Tech stack tags (pisahkan dengan koma)">
        <TextInput
          value={project.tags.join(", ")}
          onChange={(e) => updateField("tags", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
        />
      </FormField>

      <h3 className="text-sm font-mono text-zinc-400 mt-6 mb-3">Links</h3>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <FormField label="Live URL"><TextInput value={getLinkValue("Live")} onChange={(e) => setLinkAt("Live", e.target.value)} /></FormField>
        <FormField label="GitHub Frontend"><TextInput value={getLinkValue("Frontend")} onChange={(e) => setLinkAt("Frontend", e.target.value)} /></FormField>
        <FormField label="GitHub Backend"><TextInput value={getLinkValue("Backend")} onChange={(e) => setLinkAt("Backend", e.target.value)} /></FormField>
        <FormField label="GitHub Mobile"><TextInput value={getLinkValue("Mobile")} onChange={(e) => setLinkAt("Mobile", e.target.value)} /></FormField>
      </div>

      <div className="flex items-center gap-6 mb-6">
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input type="checkbox" checked={project.featured} onChange={(e) => updateField("featured", e.target.checked)} />
          Featured (tampil lebar di grid)
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input type="checkbox" checked={project.published} onChange={(e) => updateField("published", e.target.checked)} />
          Published
        </label>
      </div>

      <h3 className="text-sm font-mono text-zinc-400 mb-3">Thumbnail</h3>
      <ImageUploadField
        label="Thumbnail card"
        value={project.thumbnailThumb}
        publicUrlThumb={thumbUrlThumb}
        publicUrlFull={thumbUrlFull}
        disabled={slugMissing}
        disabledReason="Isi slug terlebih dahulu sebelum upload thumbnail."
        onUploaded={(thumbUrl, fullUrl) => {
          updateField("thumbnailThumb", thumbUrl);
          updateField("thumbnail", fullUrl);
        }}
        onRemoved={() => {
          updateField("thumbnail", null);
          updateField("thumbnailThumb", null);
        }}
      />

      <h3 className="text-sm font-mono text-zinc-400 mt-8 mb-3">Galeri</h3>
      <SortableList
        items={project.gallery}
        getId={(image) => image.id}
        onReorder={reorderGallery}
        renderItem={(image) => (
          <div className="border border-white/10 rounded-xl p-4 flex gap-4">
            <ImageUploadField
              label="Gambar"
              value={image.thumbSrc}
              publicUrlThumb={"/images/projects/" + project.slug + "/" + image.id + "-thumb.webp"}
              publicUrlFull={"/images/projects/" + project.slug + "/" + image.id + ".webp"}
              disabled={slugMissing}
              disabledReason="Isi slug terlebih dahulu sebelum upload gambar galeri."
              onUploaded={(thumbUrl, fullUrl) => updateGalleryImageUrls(image.id, thumbUrl, fullUrl)}
              onRemoved={() => removeGalleryItem(image.id)}
            />
            <div className="flex-1 grid grid-cols-2 gap-3 self-start">
              <TextInput placeholder="Caption EN" value={image.captionEn} onChange={(e) => updateGalleryCaption(image.id, "en", e.target.value)} />
              <TextInput placeholder="Caption ID" value={image.captionId} onChange={(e) => updateGalleryCaption(image.id, "id", e.target.value)} />
            </div>
          </div>
        )}
      />
      <button
        onClick={addGalleryPlaceholder}
        type="button"
        disabled={slugMissing}
        className="mt-3 text-sm px-4 py-2 rounded-lg border border-white/10 text-zinc-300 hover:border-brand-400/40 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {slugMissing ? "Isi slug dulu untuk menambah gambar" : "+ Tambah gambar galeri"}
      </button>

      <PublishBar />
    </AdminLayout>
  );
}
