import { useRef, useState } from "react";
import { processImageToWebp, validateImageFile, publicUrlToRepoPath } from "../../utils/imageProcessing";
import { useAdminDraft } from "./AdminDraftContext";

export default function ImageUploadField({
  label,
  value,
  publicUrlThumb,
  publicUrlFull,
  disabled,
  disabledReason,
  onUploaded,
  onRemoved,
}) {
  const inputRef = useRef(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [localPreview, setLocalPreview] = useState(null);
  const { addPendingUpload, addPendingDelete } = useAdminDraft();

  const handleFile = async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const { thumbBlob, fullBlob } = await processImageToWebp(file);
      addPendingUpload(publicUrlToRepoPath(publicUrlThumb), thumbBlob);
      addPendingUpload(publicUrlToRepoPath(publicUrlFull), fullBlob);
      setLocalPreview(URL.createObjectURL(thumbBlob));
      onUploaded(publicUrlThumb, publicUrlFull);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = () => {
    addPendingDelete(publicUrlToRepoPath(publicUrlThumb));
    addPendingDelete(publicUrlToRepoPath(publicUrlFull));
    setLocalPreview(null);
    onRemoved();
  };

  const previewSrc = localPreview || value;

  if (disabled) {
    return (
      <div>
        <label className="block text-xs font-mono text-zinc-500 mb-1.5">{label}</label>
        <p className="text-xs text-zinc-600 italic">{disabledReason}</p>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-xs font-mono text-zinc-500 mb-1.5">{label}</label>
      {previewSrc ? (
        <div className="relative w-40 h-28 rounded-lg overflow-hidden border border-white/10 group">
          <img src={previewSrc} alt={label} className="w-full h-full object-cover" />
          <button
            onClick={handleRemove}
            type="button"
            className="absolute top-1 right-1 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Hapus
          </button>
        </div>
      ) : (
        <label className="w-40 h-28 rounded-lg border border-dashed border-white/20 flex items-center justify-center text-xs text-zinc-500 cursor-pointer hover:border-brand-400/40">
          {busy ? "Memproses..." : "Upload gambar"}
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />
        </label>
      )}
      {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
    </div>
  );
}
