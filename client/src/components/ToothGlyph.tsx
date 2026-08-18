import { useMemo } from "react";

/**
 * ToothGlyph — sketch-style anatomical tooth illustration, matching the
 * "tooth types sketch" reference (Shutterstock asset 2247132215).
 *
 * Style: hand-drawn anatomy — each tooth has a realistic crown outline with
 * cusp bumps, visible root structure (molars get 2-3 separate bulbous roots),
 * and cross-hatch shading inside the crown and roots to mimic pencil sketch.
 *
 * Orientation (FDI notation):
 *   upper teeth — crown up, roots down
 *   lower teeth — flipped vertically (roots up)
 *   left side   — mirrored horizontally
 */

export type ToothType =
  | "central_incisor"
  | "lateral_incisor"
  | "canine"
  | "premolar_1"
  | "premolar_2"
  | "molar_1"
  | "molar_2"
  | "molar_3";

type GlyphDef = {
  /** Combined crown+root outline path (closed). */
  outline: string;
  /** Cross-hatch lines drawn inside the shape for pencil-sketch shading. */
  hatching: string;
};

// ---------------------------------------------------------------------------
// Sketch-style glyph definitions
// Coordinate space: 100x100; crown top y≈8, gumline y≈56, roots end y≈96.
// ---------------------------------------------------------------------------

/** Central incisor — straight chisel crown, one slender root. */
const G_CENTRAL_INCISOR: GlyphDef = {
  outline:
    "M 36 9 L 64 9 C 68 9 71 12 71 16 L 70 47 C 70 53 66 56 61 56 L 39 56 C 34 56 30 53 30 47 L 29 16 C 29 12 32 9 36 9 Z " +
    "M 41 56 L 59 56 C 58 70 54 88 50 95 C 49.6 95.7 47.4 95.7 47 95 C 43 88 39 70 41 56 Z",
  hatching:
    "M 34 18 L 62 18 M 33 26 L 64 26 M 33 34 L 64 34 M 34 42 L 62 42 " +
    "M 38 12 L 32 24 M 52 12 L 46 24 M 66 12 L 60 24 M 44 58 L 42 84 M 56 58 L 54 84",
};

/** Lateral incisor — narrower crown, slender root. */
const G_LATERAL_INCISOR: GlyphDef = {
  outline:
    "M 39 10 L 61 10 C 65 10 67 13 67 16 L 66 48 C 66 53 63 55 59 55 L 41 55 C 37 55 34 53 34 48 L 33 16 C 33 13 35 10 39 10 Z " +
    "M 43 55 L 57 55 C 56 69 52 87 49 94 C 48.6 94.7 46.4 94.7 46 94 C 43 87 39.5 69 43 55 Z",
  hatching:
    "M 37 18 L 63 18 M 37 26 L 63 26 M 37 34 L 62 34 M 38 42 L 61 42 " +
    "M 40 13 L 35 23 M 54 13 L 49 23 M 64 13 L 59 23 M 47 58 L 46 82 M 53 58 L 52 82",
};

/** Canine — pointed cusp, long single root with slight bend. */
const G_CANINE: GlyphDef = {
  outline:
    "M 30 12 L 70 12 L 66 22 C 62 30 56 38 53 44 C 51.5 46.5 48.5 46.5 47 44 C 44 38 38 30 34 22 Z " +
    "M 30 12 C 27 16 26 20 26 25 L 26 49 C 26 54 30 57 35 57 L 65 57 C 70 57 74 54 74 49 L 74 25 C 74 20 73 16 70 12 Z " +
    "M 44 57 L 56 57 C 55 72 53 90 50 97 C 49.5 97.8 47.5 97.8 47 97 C 44 90 42 72 44 57 Z",
  hatching:
    "M 31 17 L 69 17 M 29 25 L 71 25 M 29 33 L 69 33 M 30 41 L 68 41 M 31 49 L 67 49 " +
    "M 33 14 L 28 24 M 45 14 L 40 24 M 58 14 L 53 24 M 71 14 L 66 24 M 48 59 L 48 86 M 53 59 L 52 86",
};

/** First premolar — two cusps, single root. */
const G_PREMOLAR_1: GlyphDef = {
  outline:
    "M 29 14 C 34 20 42 22 48 20 C 54 22 62 20 67 14 L 72 26 C 73 34 73 44 72 52 C 71 55 68 57 64 57 L 36 57 C 32 57 29 55 28 52 C 27 44 27 34 28 26 Z " +
    "M 43 57 L 57 57 C 56 70 53 87 50 94 C 49.6 94.8 47.4 94.8 47 94 C 44 87 41 70 43 57 Z",
  hatching:
    "M 30 22 L 70 22 M 29 30 L 71 30 M 29 38 L 71 38 M 30 46 L 70 46 " +
    "M 33 16 L 29 26 M 46 16 L 42 26 M 60 16 L 56 26 M 71 16 L 67 26 M 48 59 L 48 83 M 54 59 L 53 83",
};

/** Second premolar — single cusp, wider crown. */
const G_PREMOLAR_2: GlyphDef = {
  outline:
    "M 27 13 C 33 19 42 21 49 20 C 56 21 65 19 71 13 L 74 25 C 75 33 75 44 74 52 C 73 55 70 57 65 57 L 35 57 C 30 57 27 55 26 52 C 25 44 25 33 26 25 Z " +
    "M 43 57 L 57 57 C 56 70 53 88 50 95 C 49.6 95.8 47.4 95.8 47 95 C 44 88 41 70 43 57 Z",
  hatching:
    "M 28 21 L 73 21 M 27 29 L 74 29 M 27 37 L 74 37 M 28 45 L 73 45 " +
    "M 31 15 L 27 25 M 47 15 L 43 25 M 63 15 L 59 25 M 74 15 L 70 25 M 48 59 L 48 84 M 54 59 L 53 84",
};

/** First molar — wide crown, THREE roots (mesial, distal, plus palatal/lingual). */
const G_MOLAR_1: GlyphDef = {
  outline:
    "M 24 13 C 31 19 41 21 50 20 C 59 21 69 19 76 13 L 77 24 C 78 32 78 42 77 52 C 76 55 73 57 68 57 L 32 57 C 27 57 24 55 23 52 C 22 42 22 32 23 24 Z " +
    "M 27 57 L 37 57 C 36 70 33 86 31 93 C 30.6 93.8 29 93.8 28.7 93 C 26.5 85 25.2 70 27 57 Z " +
    "M 45 57 L 55 57 C 54.5 70 53 87 51.5 95 C 51.3 95.8 48.7 95.8 48.5 95 C 47 87 45.5 70 45 57 Z " +
    "M 63 57 L 73 57 C 74.8 70 73.5 86 71.3 93 C 71 93.8 69.4 93.8 69 93 C 67 86 64 70 63 57 Z",
  hatching:
    "M 24 21 L 76 21 M 23 29 L 77 29 M 23 37 L 77 37 M 24 45 L 76 45 " +
    "M 27 15 L 24 24 M 40 15 L 37 24 M 53 15 L 50 24 M 66 15 L 63 24 M 76 15 L 73 24 " +
    "M 31 60 L 30 84 M 35 60 L 34 84 M 48 60 L 48 86 M 52 60 L 52 86 M 67 60 L 68 84 M 71 60 L 72 84",
};

/** Second molar — slightly smaller three-rooted molar. */
const G_MOLAR_2: GlyphDef = {
  outline:
    "M 26 14 C 33 20 42 22 50 21 C 58 22 67 20 74 14 L 75 25 C 76 32 76 42 75 52 C 74 55 71 57 67 57 L 33 57 C 29 57 26 55 25 52 C 24 42 24 32 25 25 Z " +
    "M 29 57 L 38 57 C 37 69 34 85 32.5 92 C 32.1 92.8 30.6 92.8 30.2 92 C 28.2 84 27.1 69 29 57 Z " +
    "M 45 57 L 55 57 C 54.5 70 53 87 51.5 95 C 51.3 95.8 48.7 95.8 48.5 95 C 47 87 45.5 70 45 57 Z " +
    "M 62 57 L 71 57 C 72.9 69 71.8 85 69.8 92 C 69.4 92.8 67.9 92.8 67.5 92 C 66 85 63 69 62 57 Z",
  hatching:
    "M 26 22 L 74 22 M 25 30 L 75 30 M 25 38 L 75 38 M 26 46 L 74 46 " +
    "M 29 16 L 26 24 M 42 16 L 39 24 M 55 16 L 52 24 M 68 16 L 65 24 M 74 16 L 71 24 " +
    "M 33 60 L 32 83 M 36 60 L 35 83 M 48 60 L 48 86 M 52 60 L 52 86 M 65 60 L 66 83 M 69 60 L 70 83",
};

/** Third molar (wisdom) — rounded compact crown, fused root mass. */
const G_MOLAR_3: GlyphDef = {
  outline:
    "M 30 16 C 37 22 44 24 50 23 C 56 24 63 22 70 16 L 71 27 C 72 34 72 43 71 52 C 70 55 67 57 62 57 L 38 57 C 33 57 30 55 29 52 C 28 43 28 34 29 27 Z " +
    "M 39 57 L 61 57 C 60.5 69 58 84 53 92 C 52.2 93 47.8 93 47 92 C 42 84 39.5 69 39 57 Z",
  hatching:
    "M 30 23 L 70 23 M 29 31 L 71 31 M 29 39 L 71 39 M 30 47 L 70 47 " +
    "M 33 18 L 30 26 M 45 18 L 42 26 M 58 18 L 55 26 M 70 18 L 67 26 " +
    "M 45 59 L 45 83 M 50 59 L 50 85 M 55 59 L 55 83",
};

const GLYPHS: Record<ToothType, GlyphDef> = {
  central_incisor: G_CENTRAL_INCISOR,
  lateral_incisor: G_LATERAL_INCISOR,
  canine: G_CANINE,
  premolar_1: G_PREMOLAR_1,
  premolar_2: G_PREMOLAR_2,
  molar_1: G_MOLAR_1,
  molar_2: G_MOLAR_2,
  molar_3: G_MOLAR_3,
};

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

/** Mirror/flip transforms per arch position (same as before). */
export function toothTransform(fdNumber: number): string {
  const quad = Math.floor(fdNumber / 10); // 1,2,3,4
  const isUpper = quad === 1 || quad === 2;
  const isRight = quad === 1 || quad === 4;
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
  stroke = "#64748b",
  hatchColor,
  opacity = 1,
}: {
  number: number; // FDI number, e.g. 16
  fill?: string;
  /** outline + hatching line color — pass the condition stroke here */
  stroke?: string;
  hatchColor?: string;
  opacity?: number;
}) {
  const type = useMemo(() => toothTypeFromNumber(number % 100 || number), [number]);
  const glyph = GLYPHS[type];
  const transform = useMemo(() => toothTransform(number % 100 || number), [number]);
  const hatch = hatchColor ?? "color-mix(in srgb, " + stroke + " 65%, " + fill + ")";

  return (
    <g transform={transform} style={{ opacity }}>
      {/* Shape with tinted fill */}
      <path d={glyph.outline} fill={fill} stroke={stroke} strokeWidth="2" strokeLinejoin="round" />
      {/* Cross-hatch pencil shading */}
      <path
        d={glyph.hatching}
        fill="none"
        stroke={hatch}
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.85"
      />
    </g>
  );
}
