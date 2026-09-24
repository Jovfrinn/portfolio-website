export default function FormField({ label, children }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-mono text-zinc-500 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

export function TextInput(props) {
  return (
    <input
      {...props}
      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:border-brand-400/60 outline-none"
    />
  );
}

export function TextArea(props) {
  return (
    <textarea
      {...props}
      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:border-brand-400/60 outline-none min-h-[120px]"
    />
  );
}
