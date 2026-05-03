"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="inline-flex gap-1 p-1 rounded-full items-center justify-center opacity-0">
        <button className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium">
           <Sun size={18} />
           Light
        </button>
        <button className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium">
           <Moon size={18} />
           Dark
        </button>
      </div>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <div
      className="inline-flex gap-1 p-1 rounded-full items-center justify-center bg-[var(--bg-card)] border border-[var(--border)] shadow-[var(--shadow)]"
      style={{
        boxShadow: isDark ? "0 4px 12px rgba(0,0,0,0.4)" : "0 2px 8px rgba(0,0,0,0.05)",
      }}
    >
      <button
        onClick={() => setTheme("light")}
        className={`flex items-center justify-center transition-all duration-300 gap-2 px-6 py-2.5 rounded-full text-sm ${!isDark ? 'font-semibold text-[var(--text-primary)] bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9] shadow-sm' : 'font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]'}`}
        style={!isDark && !isDark ? {
          boxShadow: isDark ? "0 4px 16px rgba(124,58,237,0.4), inset 0 1px 0 rgba(255,255,255,0.15)" : "0 2px 4px rgba(124,58,237,0.2)",
          border: isDark ? "1px solid rgba(167,139,250,0.30)" : "1px solid transparent",
        } : { border: "1px solid transparent" }}
      >
        <Sun size={18} className={!isDark ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"} />
        Light
      </button>

      <button
        onClick={() => setTheme("dark")}
        className={`flex items-center justify-center transition-all duration-300 gap-2 px-6 py-2.5 rounded-full text-sm ${isDark ? 'font-semibold text-[var(--text-primary)] bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9]' : 'font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]'}`}
        style={isDark ? {
          boxShadow: isDark ? "0 4px 16px rgba(124,58,237,0.4), inset 0 1px 0 rgba(255,255,255,0.15)" : "0 2px 4px rgba(124,58,237,0.2)",
          border: isDark ? "1px solid rgba(167,139,250,0.30)" : "1px solid transparent",
        } : { border: "1px solid transparent" }}
      >
        <Moon size={18} className={isDark ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"} />
        Dark
      </button>
    </div>
  );
}
