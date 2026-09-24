import { useState } from "react";

export default function LocaleTabs({ renderEn, renderId }) {
  const [tab, setTab] = useState("en");
  return (
    <div>
      <div className="flex gap-1 mb-3 border border-white/10 rounded-lg p-1 w-fit font-mono text-xs">
        <button
          onClick={() => setTab("en")}
          className={"px-3 py-1.5 rounded " + (tab === "en" ? "bg-brand-400 text-zinc-950 font-bold" : "text-zinc-400")}
        >
          EN
        </button>
        <button
          onClick={() => setTab("id")}
          className={"px-3 py-1.5 rounded " + (tab === "id" ? "bg-brand-400 text-zinc-950 font-bold" : "text-zinc-400")}
        >
          ID
        </button>
      </div>
      {tab === "en" ? renderEn() : renderId()}
    </div>
  );
}
