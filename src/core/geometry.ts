/** Path-building helpers so parts stay readable. All return SVG path data. */

/** Rounded rectangle centered on its own coordinates. */
export function rr(x: number, y: number, w: number, h: number, r: number): string {
  const rad = Math.min(r, w / 2, h / 2);
  return (
    `M ${x + rad} ${y} h ${w - 2 * rad} a ${rad} ${rad} 0 0 1 ${rad} ${rad} ` +
    `v ${h - 2 * rad} a ${rad} ${rad} 0 0 1 ${-rad} ${rad} h ${-(w - 2 * rad)} ` +
    `a ${rad} ${rad} 0 0 1 ${-rad} ${-rad} v ${-(h - 2 * rad)} a ${rad} ${rad} 0 0 1 ${rad} ${-rad} Z`
  );
}

export function circle(cx: number, cy: number, r: number): string {
  return `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0 Z`;
}

export function ellipse(cx: number, cy: number, rx: number, ry: number): string {
  return `M ${cx - rx} ${cy} a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z`;
}

/**
 * Top cap of a circle of radius r, cut by a horizontal chord at cy + chordY.
 * When the chord sits below the circle's center (chordY > 0) the top segment
 * is the major arc, so the large-arc flag must flip — otherwise the arc takes
 * the short path and renders a lens across the middle instead of a cap.
 */
export function topCap(r: number, chordY: number, cx = 0, cy = 0): string {
  const half = Math.sqrt(Math.max(0, r * r - chordY * chordY));
  const largeArc = chordY > 0 ? 1 : 0;
  return `M ${cx - half} ${cy + chordY} A ${r} ${r} 0 ${largeArc} 1 ${cx + half} ${cy + chordY} Z`;
}
