export default function ConfirmDialog({ open, title, description, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-[#111] border border-white/10 rounded-2xl p-6 max-w-sm w-full">
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-sm text-zinc-400 mb-6">{description}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm text-zinc-300 hover:bg-white/5">
            Batal
          </button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-lg text-sm bg-rose-500 text-white hover:bg-rose-600">
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}
