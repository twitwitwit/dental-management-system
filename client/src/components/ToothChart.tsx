import { cn } from "@/lib/utils";

/**
 * Adult dentition chart (FDI notation, 32 teeth) rendered as an SVG grid.
 * Each tooth is clickable; selected tooth is highlighted. Colors reflect
 * recorded conditions.
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

/** FDI numbering: [upperRight, upperLeft, lowerLeft, lowerRight] per quadrant, each 8 teeth. */
const QUADRANTS = [
  [18, 17, 16, 15, 14, 13, 12, 11],
  [21, 22, 23, 24, 25, 26, 27, 28],
  [31, 32, 33, 34, 35, 36, 37, 38],
  [48, 47, 46, 45, 44, 43, 42, 41],
];

export type ToothMap = Record<string, string>; // toothNumber -> condition key

export function ToothChart({
  conditions,
  selected,
  onSelect,
  size = 44,
  gap = 4,
}: {
  conditions: ToothMap;
  selected?: string | null;
  onSelect?: (toothNumber: string) => void;
  size?: number;
  gap?: number;
}) {
  const cols = 8;
  const rowHeight = size + gap;
  const colWidth = size + gap;

  return (
    <div className="w-full overflow-x-auto">
      <div
        className="mx-auto"
        style={{ width: cols * colWidth + gap }}
      >
        {QUADRANTS.map((quadrant, qi) => (
          <div
            key={qi}
            className="grid grid-cols-8"
            style={{ gap, marginBottom: qi === 1 ? 10 : gap }}
          >
            {quadrant.map(number => {
              const cond = conditions[number];
              const color = cond ? CONDITION_COLORS[cond] ?? "#e2e8f0" : "#f1f5f9";
              const isSelected = selected === String(number);
              return (
                <button
                  key={number}
                  type="button"
                  onClick={() => onSelect?.(String(number))}
                  aria-label={`Tooth ${number}`}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-lg border transition-all",
                    isSelected
                      ? "border-primary ring-2 ring-primary/30 scale-105 shadow-md"
                      : cond
                        ? "border-transparent hover:scale-105 hover:shadow"
                        : "border-slate-200 hover:border-primary/50 hover:scale-105",
                  )}
                  style={{
                    width: size,
                    height: size,
                    backgroundColor: color,
                  }}
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5 opacity-60">
                    <path
                      d="M12 2c-3 0-5 2-6 4-1 2-2 6-1 10 .8 3.5 2 5 3 5 .9 0 1.3-2 2-3 .3-.4.8-.6 1.3-.6h1.4c.5 0 1 .2 1.3.6.7 1 1.1 3 2 3 1 0 2.2-1.5 3-5 1-4 0-8-1-10-1-2-3-4-6-4z"
                      fill="white"
                      stroke="rgba(0,0,0,0.35)"
                      strokeWidth="1.2"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span
                    className={cn(
                      "mt-0.5 text-[10px] font-semibold leading-none",
                      cond ? "text-white" : "text-slate-500",
                    )}
                  >
                    {number}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
