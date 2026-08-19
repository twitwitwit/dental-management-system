import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ToothGlyph } from "./ToothGlyph";

/**
 * Adult dentition chart (FDI notation, 32 teeth) laid out like the reference
 * odontogram export: each arch is one continuous row — the glyphs carry their
 * own cream bone and pink gum-base layers, so adjacent teeth visually join
 * into one continuous arch band. FDI numbers sit above the upper arch and
 * below the lower arch. Colors reflect recorded conditions; teeth are
 * clickable. The chart auto-fits its container width.
 */
export const CONDITION_COLORS: Record<string, string> = {
  healthy: "#10b981",
  decay: "#ef4444",
  filling: "#3b82f6",
  crown: "#8b5cf6",
  extraction: "#94a3b8",
  implant: "#6366f1",
  root_canal: "#f97316",
  missing: "#cbd5e1",
  veneers: "#14b8a6",
  bridge: "#a855f7",
};

/** Condition fill -> stroke contrast pair used for highlights. */
export const CONDITION_STROKE: Record<string, string> = {
  healthy: "#047857",
  decay: "#b91c1c",
  filling: "#1d4ed8",
  crown: "#6d28d9",
  extraction: "#475569",
  implant: "#4338ca",
  root_canal: "#c2410c",
  missing: "#94a3b8",
  veneers: "#0f766e",
  bridge: "#7e22ce",
};

/** Upper arch left-to-right: 18..11 then 21..28. Lower arch: 48..41 then 31..38. */
const UPPER_ARCH = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_ARCH = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

export type ToothMap = Record<string, string>; // toothNumber -> condition key

export function ToothChart({
  conditions,
  selected,
  onSelect,
  size,
  gap = 6,
}: {
  conditions: ToothMap;
  selected?: string | null;
  onSelect?: (toothNumber: string) => void;
  /** per-cell size in px; auto-fits the container when omitted */
  size?: number;
  gap?: number;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [autoWidth, setAutoWidth] = useState<number | null>(null);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const obs = new ResizeObserver(entries => {
      for (const e of entries) setAutoWidth(e.contentRect.width);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  const cols = 16;
  const width = autoWidth ?? 0;
  const sizeAuto = Math.floor((width - (cols - 1) * gap) / cols);
  const cellSize = size ?? Math.max(26, Math.min(sizeAuto, 64));

  function renderArch(arch: number[], isUpper: boolean) {
      return (
      <div key={isUpper ? "upper" : "lower"} className="relative" style={{ width }}>
        {/* FDI number row */}
        <div
          className="grid justify-items-center"
          style={{
            gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
            columnGap: gap,
            height: 18,
          }}
        >
          {arch.map(n => (
            <span
              key={n}
              className={cn(
                "text-[11px] font-bold leading-none",
                selected === String(n) ? "text-primary" : "text-slate-500",
              )}
              style={{ width: cellSize }}
            >
              {n}
            </span>
          ))}
        </div>
        {/* teeth row — the glyphs' own bone/gum layers adjoin side by side
            to form the continuous arch band, like the reference export */}
        <div className="relative" style={{ height: cellSize }}>
          <div
            className="justify-items-center relative"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
              columnGap: gap,
            }}
          >
            {arch.map(n => (
              <button
                key={n}
                type="button"
                onClick={() => onSelect?.(String(n))}
                aria-label={`Tooth ${n}`}
                className={cn(
                  "relative rounded-md transition-all duration-200 cursor-pointer",
                  selected === String(n) && "scale-105",
                )}
                style={{
                  width: cellSize,
                  height: cellSize,
                  marginTop: isUpper ? 0 : 10,
                  zIndex: selected === String(n) ? 10 : 1,
                }}
              >
                <svg
                  viewBox="0 0 44 90"
                  className="w-full h-full"
                  preserveAspectRatio="xMidYMid meet"
                >
                  <ToothGlyph
                    number={n}
                    fill={
                      conditions[n] ? CONDITION_COLORS[conditions[n]] : "#f8fafc"
                    }
                    stroke={
                      conditions[n] && CONDITION_STROKE[conditions[n]]
                        ? CONDITION_STROKE[conditions[n]]
                        : "#94a3b8"
                    }
                    cond={conditions[n]}
                    selected={selected === String(n)}
                  />
                </svg>
                {selected === String(n) && (
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-1 w-10 bg-primary rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
      );
  }

  return (
    <div ref={wrapRef} className="w-full">
      <div className="mx-auto" style={{ width: width || 640 }}>
        {renderArch(UPPER_ARCH, true)}
        {/* inter-arch spacing (midline gap, like the reference export) */}
        <div style={{ height: 40 }} />
        {renderArch(LOWER_ARCH, false)}
      </div>
    </div>
  );
}
