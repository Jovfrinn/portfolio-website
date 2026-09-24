import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { blobToBase64 } from "../../utils/imageProcessing";

const AdminDraftContext = createContext(null);

// Mirrors the server-side MAX_BATCH_BYTES in pages/api/admin/publish.js (Task 15) - kept
// as a literal here rather than imported, since that file is server-only and this module
// ships to the browser. Measured on the base64 STRING length (the actual request body
// size), not the smaller decoded binary size.
const MAX_BATCH_BYTES = 4 * 1024 * 1024;

export function AdminDraftProvider({ children }) {
  const [portfolio, setPortfolio] = useState(null);
  const [baseSha, setBaseSha] = useState(null);
  const [pendingUploads, setPendingUploads] = useState([]);
  const [pendingDeletes, setPendingDeletes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [publishMessage, setPublishMessage] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/data");
      if (!res.ok) throw new Error("load_failed");
      const json = await res.json();
      setPortfolio(json.portfolio);
      setBaseSha(json.baseSha);
      setPendingUploads([]);
      setPendingDeletes([]);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updatePortfolio = useCallback((updater) => {
    setPortfolio((prev) => {
      if (!prev) return prev;
      const next = typeof updater === "function" ? updater(prev) : updater;
      return { ...next, __touched: true };
    });
  }, []);

  const addPendingUpload = useCallback((uploadPath, blob) => {
    const previewUrl = URL.createObjectURL(blob);
    setPendingUploads((prev) => [...prev.filter((u) => u.path !== uploadPath), { path: uploadPath, blob, previewUrl }]);
    return previewUrl;
  }, []);

  const addPendingDelete = useCallback((deletePath) => {
    if (!deletePath) return;
    setPendingDeletes((prev) => (prev.includes(deletePath) ? prev : [...prev, deletePath]));
    setPendingUploads((prev) => prev.filter((u) => u.path !== deletePath));
  }, []);

  const isDirty =
    pendingUploads.length > 0 || pendingDeletes.length > 0 || Boolean(portfolio && portfolio.__touched);

  const publish = useCallback(async () => {
    if (!portfolio) return;
    setPublishing(true);
    setPublishMessage(null);
    try {
      const uploadsPayload = await Promise.all(
        pendingUploads.map(async (upload) => ({ path: upload.path, base64: await blobToBase64(upload.blob) }))
      );

      const totalBase64Bytes = uploadsPayload.reduce((sum, upload) => sum + upload.base64.length, 0);
      if (totalBase64Bytes > MAX_BATCH_BYTES) {
        setPublishMessage({
          type: "error",
          text: "Total ukuran gambar baru melebihi 4 MB. Kurangi jumlah gambar atau publish bertahap.",
        });
        return;
      }

      const { __touched, ...cleanPortfolio } = portfolio;

      const res = await fetch("/api/admin/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portfolio: cleanPortfolio,
          baseSha,
          uploads: uploadsPayload,
          deletes: pendingDeletes,
        }),
      });

      const json = await res.json();

      if (res.status === 409) {
        setPublishMessage({ type: "conflict", text: json.message });
        return;
      }
      if (!res.ok) {
        setPublishMessage({ type: "error", text: json.message || "Publish gagal." });
        return;
      }

      setPublishMessage({ type: "success", text: json.message });
      await load();
    } catch (publishError) {
      setPublishMessage({ type: "error", text: publishError.message });
    } finally {
      setPublishing(false);
    }
  }, [portfolio, baseSha, pendingUploads, pendingDeletes, load]);

  const value = useMemo(
    () => ({
      portfolio,
      loading,
      error,
      updatePortfolio,
      addPendingUpload,
      addPendingDelete,
      pendingUploads,
      pendingDeletes,
      isDirty,
      publish,
      publishing,
      publishMessage,
      reload: load,
    }),
    [
      portfolio,
      loading,
      error,
      updatePortfolio,
      addPendingUpload,
      addPendingDelete,
      pendingUploads,
      pendingDeletes,
      isDirty,
      publish,
      publishing,
      publishMessage,
      load,
    ]
  );

  return <AdminDraftContext.Provider value={value}>{children}</AdminDraftContext.Provider>;
}

export function useAdminDraft() {
  const ctx = useContext(AdminDraftContext);
  if (!ctx) throw new Error("useAdminDraft must be used within AdminDraftProvider");
  return ctx;
}
