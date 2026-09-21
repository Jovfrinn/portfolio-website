import React from "react";

const WorkCard = ({ img, name, description, onClick }) => {
  return (
    <div
      className="overflow-hidden rounded-2xl border border-slate-100 dark:border-zinc-800/80 p-3 bg-white dark:bg-zinc-900/10 cursor-pointer group hover:border-slate-300 dark:hover:border-zinc-700 transition-all duration-300"
      onClick={onClick}
    >
      <div className="relative rounded-xl overflow-hidden aspect-[16/10] bg-slate-50 dark:bg-zinc-900/50">
        <img
          alt={name}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          src={img}
        />
      </div>
      <div className="p-3">
        <h1 className="text-lg font-bold text-slate-800 dark:text-zinc-100 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 tracking-tight flex items-center gap-2 transition-colors duration-200">
          {name ? name : "Project Name"}
          <span className="text-xs font-mono font-normal opacity-0 group-hover:opacity-100 translate-x-[-4px] group-hover:translate-x-0 transition-all duration-200 text-emerald-500 dark:text-emerald-400">
            →
          </span>
        </h1>
        <h2 className="text-sm text-slate-500 dark:text-zinc-400 mt-1 line-clamp-2">
          {description ? description : "Description"}
        </h2>
      </div>
    </div>
  );
};

export default WorkCard;
