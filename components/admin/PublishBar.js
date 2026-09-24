import { useAdminDraft } from "./AdminDraftContext";

export default function PublishBar() {
  const { isDirty, publish, publishing, publishMessage, pendingUploads, pendingDeletes } = useAdminDraft();

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-[#0a0a0a]/95 backdrop-blur px-6 py-4 flex items-center justify-between z-40">
      <div className="text-sm text-zinc-400 font-mono">
        {isDirty
          ? pendingUploads.length + " gambar baru, " + pendingDeletes.length + " dihapus, perubahan belum dipublish."
          : "Tidak ada perubahan."}
        {publishMessage && (
          <span className={"ml-3 " + (publishMessage.type === "success" ? "text-brand-400" : "text-rose-400")}>
            {publishMessage.text}
          </span>
        )}
      </div>
      <button
        onClick={publish}
        disabled={!isDirty || publishing}
        className="text-sm px-6 py-2.5 rounded-full font-mono font-bold bg-brand-400 text-zinc-950 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-300 transition-all"
      >
        {publishing ? "Mempublish..." : "Publish"}
      </button>
    </div>
  );
}
