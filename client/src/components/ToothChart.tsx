import { cn } from "@/lib/utils";
import { ToothGlyph } from "./ToothGlyph";

/**
 * Adult dentition chart (FDI notation, 32 teeth) rendered with a realistic
 * tooth illustration per tooth: each of the 32 teeth is drawn as a distinct
 * glyph shaped by type (incisors, canines, premolars, molars with roots).
 * Colors reflect recorded conditions; each tooth is clickable.
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

/** Condition fill -> stroke contrast pair used for the tooth outlines. */
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

/** FDI numbering: [upperRight, upperLeft, lowerLeft, lowerRight] per quadrant, each 8 teeth. */
const QUADRANTS = [
  [18, 17, 16, 15, 14, 13, 12, 11],
  [21, 22, 23, 24, 25, 26, 27, 28],
  [31, 32, 33, 34, 35, 36, 37, 38],
  [48, 47, 46, 45, 44, 43, 42, 41],
];

export type ToothMap = Record<string, string>; // toothNumber -> condition key

/**
 * Renders a single illustrated tooth cell: glyph plus its FDI number label.
 */
function ToothCell({
  number,
  cond,
  selected,
  onSelect,
  size,
}: {
  number: number;
  cond?: string;
  selected?: boolean;
  onSelect?: (n: string) => void;
  size: number;
}) {
  const fill = cond ? CONDITION_COLORS[cond] ?? "#f1f5f9" : "#f8fafc";
  const stroke = cond && CONDITION_STROKE[cond] ? CONDITION_STROKE[cond] : "#94a3b8";
  const isMissing = cond === "missing" || cond === "extraction";

  return (
    <button
      type="button"
      onClick={() => onSelect?.(String(number))}
      aria-label={`Tooth ${number}`}
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border transition-all duration-200",
        selected
          ? "border-primary ring-2 ring-primary/30 scale-105 shadow-md"
          : cond
            ? "border-transparent hover:scale-105 hover:shadow"
            : "border-slate-200 hover:border-primary/50 hover:scale-105",
      )}
      style={{ width: size, height: size, backgroundColor: cond ? "transparent" : "#f8fafc" }}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full px-1 py-0.5" style={{ opacity: isMissing ? 0.35 : 1 }}>
        <ToothGlyph
          number={number}
          fill={fill}
          stroke={stroke}
          cond={cond}
          selected={selected}
        />
      </svg>
      <span
        className={cn(
          "absolute bottom-0.5 text-[10px] font-semibold leading-none",
          cond ? "text-slate-600" : "text-slate-500",
        )}
      >
        {number}
      </span>
    </button>
  );
}

export function ToothChart({
  conditions,
  selected,
  onSelect,
  size = 48,
  gap = 4,
}: {
  conditions: ToothMap;
  selected?: string | null;
  onSelect?: (toothNumber: string) => void;
  size?: number;
  gap?: number;
}) {
  const cols = 8;
  const colWidth = size + gap;

  return (
    <div className="w-full overflow-x-auto">
      <div className="mx-auto relative" style={{ width: cols * colWidth + gap }}>
        {QUADRANTS.map((quadrant, qi) => (
          <div
            key={qi}
            className="grid grid-cols-8"
            style={{ gap, marginBottom: qi === 1 ? 10 : gap }}
          >
            {quadrant.map(number => (
              <div key={number} className="relative">
                <ToothCell
                  number={number}
                  cond={conditions[number]}
                  selected={selected === String(number)}
                  onSelect={onSelect}
                  size={size}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
