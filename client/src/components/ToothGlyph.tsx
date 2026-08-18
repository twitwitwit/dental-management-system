import { useMemo } from "react";

/**
 * ToothGlyph — a realistic tooth illustration, shaped per tooth type.
 *
 * Each adult tooth type gets its own SVG drawing:
 *   incisors   — single flat-edged crown, single conical root
 *   canines    — pointed cusp crown, single long root
 *   premolars  — broader crown with one or two cusps, single/twin roots
 *   molars     — wide crown with 3-4 cusps and 2-3 roots
 *
 * The tooth is drawn in a coordinate space that is mirrored automatically:
 *   upper teeth point roots down, lower teeth point roots up, and the
 *   left-side teeth are flipped horizontally so they read correctly on the arch.
 */

export type ToothType = "central_incisor" | "lateral_incisor" | "canine" | "premolar_1" | "premolar_2" | "molar_1" | "molar_2" | "molar_3";

export type ToothPosition = "upper" | "lower"; // orientation of the root
export type ToothSide = "right" | "left"; // which side of the arch (for mirroring)

type GlyphDef = {
  // Path drawn for a RIGHT-side upper tooth. Crown up, root down,
  // x range 0..100, crown occupies y 0..55, root y 55..100.
  crown: string;
  root: string;
  // cusp/occlusal detail lines drawn over the crown fill
  detail?: string;
};

// ---------------------------------------------------------------------------
// Glyph definitions (anatomical shapes)
// ---------------------------------------------------------------------------

/** Central incisor — straight chisel-like crown, one tapering root. */
const GLYPH_CENTRAL_INCISOR: GlyphDef = {
  crown: "M 34 4 L 66 4 C 70 4 72 7 72 11 L 72 46 C 72 52 68 56 62 56 L 38 56 C 32 56 28 52 28 46 L 28 11 C 28 7 30 4 34 4 Z",
  root: "M 40 56 L 60 56 C 58 72 54 92 50 98 C 49.5 99 47.5 99 47 98 C 43 90 39 72 40 56 Z",
  detail: "M 50 8 L 50 48",
};

/** Lateral incisor — narrower, slightly rounded crown, one root. */
const GLYPH_LATERAL_INCISOR: GlyphDef = {
  crown: "M 38 5 L 62 5 C 66 5 68 8 68 12 L 68 47 C 68 52 65 55 60 55 L 40 55 C 35 55 32 52 32 47 L 32 12 C 32 8 34 5 38 5 Z",
  root: "M 42 55 L 58 55 C 56 70 52 90 48.5 97 C 48 98 46 98 45.5 97 C 42 88 39 70 42 55 Z",
  detail: "M 50 9 L 50 47",
};

/** Canine — pointed cusp, robust single long root. */
const GLYPH_CANINE: GlyphDef = {
  crown: "M 32 8 L 68 8 C 64 18 58 26 54 34 C 52.5 37 47.5 37 46 34 C 42 26 36 18 32 8 Z M 32 8 C 28 12 27 16 27 21 L 27 48 C 27 53 31 56 36 56 L 64 56 C 69 56 73 53 73 48 L 73 21 C 73 16 72 12 68 8 Z",
  root: "M 43 56 L 57 56 C 56 70 53 92 50 99 C 49.5 99.8 46.5 99.8 46 99 C 43 92 40 70 43 56 Z",
  detail: "M 34 24 L 40 46 M 66 24 L 60 46",
};

/** First premolar — two cusps, one root. */
const GLYPH_PREMOLAR_1: GlyphDef = {
  crown: "M 30 10 C 36 14 44 16 50 14 C 56 16 64 14 70 10 C 74 18 73 30 73 46 C 73 52 69 56 63 56 L 37 56 C 31 56 27 52 27 46 L 27 30 C 27 20 28 14 30 10 Z",
  root: "M 42 56 L 58 56 C 57 70 54 90 50.5 97 C 50 98 46 98 45.5 97 C 42 88 39 70 42 56 Z",
  detail: "M 36 16 L 36 48 M 64 16 L 64 48",
};

/** Second premolar — broader single-rooted crown. */
const GLYPH_PREMOLAR_2: GlyphDef = {
  crown: "M 28 9 C 35 14 44 16 50 15 C 56 16 65 14 72 9 C 75 17 74 30 74 46 C 74 52 70 56 63 56 L 37 56 C 30 56 26 52 26 46 L 26 30 C 26 19 27 13 28 9 Z",
  root: "M 42 56 L 58 56 C 57 70 53 91 50 97 C 49.5 98 46.5 98 46 97 C 43 89 39 70 42 56 Z",
  detail: "M 38 15 L 38 48 M 50 15 L 50 48 M 62 15 L 62 48",
};

/** First molar — wide crown, three roots. */
const GLYPH_MOLAR_1: GlyphDef = {
  crown: "M 25 8 C 33 13 42 15 50 14 C 58 15 67 13 75 8 C 77 15 76 28 76 46 C 76 52 72 56 66 56 L 34 56 C 28 56 24 52 24 46 L 24 28 C 24 18 24 12 25 8 Z",
  root: "M 30 56 L 40 56 C 38 72 35 88 33 95 C 32.6 96 31 96 30.8 95 C 29 87 28 72 30 56 Z M 46 56 L 54 56 C 53 70 51 86 50 96 C 49.8 97 46.2 97 46 96 C 45 86 43 70 46 56 Z M 60 56 L 70 56 C 72 72 71 87 69.2 95 C 69 96 67.4 96 67 95 C 65 88 62 72 60 56 Z",
  detail: "M 32 14 L 32 48 M 43 14 L 43 48 M 54 14 L 54 48 M 65 14 L 65 48",
};

/** Second molar — slightly smaller first molar shape. */
const GLYPH_MOLAR_2: GlyphDef = {
  crown: "M 27 9 C 35 14 43 16 50 15 C 57 16 65 14 73 9 C 75 16 74 29 74 46 C 74 52 70 56 64 56 L 36 56 C 30 56 26 52 26 46 L 26 29 C 26 19 26 13 27 9 Z",
  root: "M 32 56 L 41 56 C 40 71 37 87 35 94 C 34.6 95 33 95 32.8 94 C 31 86 30 71 32 56 Z M 47 56 L 53 56 C 52.5 70 50.5 86 49.5 95 C 49.3 96 46.7 96 46.5 95 C 45.5 86 43.5 70 47 56 Z M 59 56 L 68 56 C 70 71 69 87 67.2 94 C 67 95 65.4 95 65.2 94 C 63 87 60 71 59 56 Z",
  detail: "M 34 15 L 34 48 M 44 15 L 44 48 M 56 15 L 56 48 M 66 15 L 66 48",
};

/** Third molar (wisdom tooth) — rounded compact crown, fused roots. */
const GLYPH_MOLAR_3: GlyphDef = {
  crown: "M 31 12 C 38 17 45 18 50 17 C 55 18 62 17 69 12 C 72 20 71 31 71 46 C 71 52 68 55 62 55 L 38 55 C 32 55 29 52 29 46 L 29 32 C 29 22 30 16 31 12 Z",
  root: "M 40 55 L 60 55 C 59 68 56 84 52 93 C 51.5 94 48.5 94 48 93 C 44 84 41 68 40 55 Z",
  detail: "M 38 18 L 38 47 M 50 17 L 50 47 M 62 18 L 62 47",
};

// ---------------------------------------------------------------------------
// Mapping FDI tooth number -> type
// ---------------------------------------------------------------------------

export function toothTypeFromNumber(fdNumber: number): ToothType {
  const pos = fdNumber % 10; // 1..8 within quadrant
  switch (pos) {
    case 1: return "central_incisor";
    case 2: return "lateral_incisor";
    case 3: return "canine";
    case 4: return "premolar_1";
    case 5: return "premolar_2";
    case 6: return "molar_1";
    case 7: return "molar_2";
    default: return "molar_3";
  }
}

const GLYPHS: Record<ToothType, GlyphDef> = {
  central_incisor: GLYPH_CENTRAL_INCISOR,
  lateral_incisor: GLYPH_LATERAL_INCISOR,
  canine: GLYPH_CANINE,
  premolar_1: GLYPH_PREMOLAR_1,
  premolar_2: GLYPH_PREMOLAR_2,
  molar_1: GLYPH_MOLAR_1,
  molar_2: GLYPH_MOLAR_2,
  molar_3: GLYPH_MOLAR_3,
};

/**
 * Returns SVG content transformed for the tooth's arch position:
 *   upper teeth — as drawn (crown up, roots down)
 *   lower teeth — flipped vertically (rotate 180 around center)
 *   left side   — mirrored horizontally
 */
export function toothTransform(fdNumber: number): string {
  const quad = Math.floor(fdNumber / 10); // 1,2,3,4
  const isUpper = quad === 1 || quad === 2;
  const isRight = quad === 1 || quad === 4;
  // translate to center (50,50), apply transforms, translate back
  const ops: string[] = [];
  if (!isRight) ops.push("scale(-1 1)");
  if (!isUpper) ops.push("scale(1 -1)");
  if (ops.length === 0) return "";
  return `translate(50 50) ${ops.join(" ")} translate(-50 -50)`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ToothGlyph({
  number,
  fill = "#f8fafc",
  stroke = "#94a3b8",
  rootFill,
  highlight = "#0f766e",
  opacity = 1,
}: {
  number: number; // FDI number, e.g. 16
  fill?: string;
  stroke?: string;
  /** optional distinct root color (defaults to shaded fill) */
  rootFill?: string;
  highlight?: string;
  opacity?: number;
}) {
  const type = useMemo(() => toothTypeFromNumber(number % 100 || number), [number]);
  const glyph = GLYPHS[type];
  const transform = useMemo(() => toothTransform(number % 100 || number), [number]);
  const rootColor = rootFill ?? "color-mix(in srgb, " + fill + " 82%, #475569)";

  return (
    <g transform={transform} style={{ opacity }}>
      {/* Root (drawn first so the crown overlaps cleanly) */}
      <path d={glyph.root} fill={rootColor} stroke={stroke} strokeWidth="2.2" strokeLinejoin="round" />
      {/* Crown */}
      <path d={glyph.crown} fill={fill} stroke={stroke} strokeWidth="2.2" strokeLinejoin="round" />
      {/* Cusp / morphology detail lines */}
      {glyph.detail ? (
        <path
          d={glyph.detail}
          fill="none"
          stroke={highlight}
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.45"
        />
      ) : null}
    </g>
  );
}
