import React from "react";
import data from "../../data/portfolio.json";

const Button = ({ children, type, onClick, classes }) => {
  if (type === "primary") {
    return (
      <button
        onClick={onClick}
        type="button"
        className={`text-xs tablet:text-sm px-4 tablet:px-5 py-2 tablet:py-2.5 rounded-xl font-mono whitespace-nowrap bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
          data.showCursor && "cursor-none"
        } ${classes}`}
      >
        {children}
      </button>
    );
  }

  // Default / Outlined style matching the "Hubungi saya" button
  return (
    <button
      onClick={onClick}
      type="button"
      className={`text-xs tablet:text-sm px-4 tablet:px-5 py-2 tablet:py-2.5 rounded-xl font-mono whitespace-nowrap border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
        data.showCursor && "cursor-none"
      } ${classes}`}
    >
      {children}
    </button>
  );
};

export default Button;
